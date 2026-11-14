const sharp = require("sharp");
const { app, db, request, resetDb, createUser, addBook } = require("./helpers");

beforeEach(resetDb);
afterAll(() => db.end());

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// A real 800x600 PNG to upload
const photo = () =>
  sharp({ create: { width: 800, height: 600, channels: 3, background: "#3366cc" } }).png().toBuffer();

const upload = (who, buffer, { filename = "me.png", contentType = "image/png", id = who.user.id } = {}) =>
  request(app)
    .put(`/api/users/${id}/avatar`)
    .set(auth(who.token))
    .attach("avatar", buffer, { filename, contentType });

const fetchImage = (url) =>
  request(app)
    .get(url)
    .buffer(true)
    .parse((res, cb) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => cb(null, Buffer.concat(chunks)));
    });

describe("uploading", () => {
  it("stores a 256x256 WebP and serves it at the returned URL", async () => {
    const alice = await createUser();

    const res = await upload(alice, await photo());

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toMatch(new RegExp(`^/api/readers/${alice.user.username}/avatar\\?v=\\d+$`));

    const image = await fetchImage(res.body.avatarUrl);
    expect(image.status).toBe(200);
    expect(image.headers["content-type"]).toBe("image/webp");
    expect(image.headers["cache-control"]).toContain("immutable");
    const meta = await sharp(image.body).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["webp", 256, 256]);
  });

  it("gives each new upload a new URL", async () => {
    const alice = await createUser();
    const first = (await upload(alice, await photo())).body.avatarUrl;
    const second = (await upload(alice, await photo())).body.avatarUrl;
    expect(second).not.toBe(first);
  });

  it("rejects a file that only claims to be an image", async () => {
    const alice = await createUser();
    const res = await upload(alice, Buffer.from("definitely not a png"));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/couldn't be read as an image/);
  });

  it("rejects unsupported file types and missing files", async () => {
    const alice = await createUser();

    const text = await upload(alice, Buffer.from("hello"), { filename: "a.txt", contentType: "text/plain" });
    expect(text.status).toBe(400);

    const none = await request(app).put(`/api/users/${alice.user.id}/avatar`).set(auth(alice.token));
    expect(none.status).toBe(400);
  });

  it("rejects files over 5 MB", async () => {
    const alice = await createUser();
    const res = await upload(alice, Buffer.alloc(5 * 1024 * 1024 + 1));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/5 MB/);
  });

  it("only lets users change their own picture", async () => {
    const alice = await createUser();
    const bob = await createUser();

    expect((await upload(bob, await photo(), { id: alice.user.id })).status).toBe(403);
    expect((await request(app).put(`/api/users/${alice.user.id}/avatar`)).status).toBe(401);
  });
});

describe("where avatars appear", () => {
  it("is null everywhere until a picture is uploaded", async () => {
    const alice = await createUser();
    expect(alice.user.avatarUrl).toBeNull();
    expect((await request(app).get(`/api/readers/${alice.user.username}`)).body.avatarUrl).toBeNull();
    expect((await request(app).get(`/api/readers/${alice.user.username}/avatar`)).status).toBe(404);
  });

  it("is included on the profile, at login, in the feed and in book reviews", async () => {
    const alice = await createUser();
    const me = await createUser();
    const { avatarUrl } = (await upload(alice, await photo())).body;
    await addBook(alice.token, { book_id: "dune" });
    await request(app).patch("/api/history/user-books/dune").set(auth(alice.token)).send({ review: "Great" });
    await request(app).post(`/api/readers/${alice.user.username}/follow`).set(auth(me.token));

    expect((await request(app).get(`/api/readers/${alice.user.username}`)).body.avatarUrl).toBe(avatarUrl);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: alice.user.email, password: alice.password });
    expect(login.body.user.avatarUrl).toBe(avatarUrl);
    expect((await request(app).get("/api/feed").set(auth(me.token))).body.items[0].avatarUrl).toBe(avatarUrl);
    expect((await request(app).get("/api/books/dune/reviews")).body.reviews[0].avatarUrl).toBe(avatarUrl);
  });

  it("is still shown for private profiles, like the username", async () => {
    const alice = await createUser();
    await upload(alice, await photo());
    await request(app).put(`/api/users/${alice.user.id}/privacy`).set(auth(alice.token)).send({ isPrivate: true });

    const res = await request(app).get(`/api/readers/${alice.user.username}`);
    expect(res.body.avatarUrl).not.toBeNull();
    expect((await fetchImage(res.body.avatarUrl)).status).toBe(200);
  });
});

it("removes the picture", async () => {
  const alice = await createUser();
  await upload(alice, await photo());

  const res = await request(app).delete(`/api/users/${alice.user.id}/avatar`).set(auth(alice.token));

  expect(res.body).toEqual({ avatarUrl: null });
  expect((await request(app).get(`/api/readers/${alice.user.username}/avatar`)).status).toBe(404);
});
