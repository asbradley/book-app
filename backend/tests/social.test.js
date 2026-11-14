const { app, db, request, resetDb, createUser, addBook } = require("./helpers");

beforeEach(resetDb);
afterAll(() => db.end());

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const getReader = (username, token) => {
  const req = request(app).get(`/api/readers/${username}`);
  return token ? req.set(auth(token)) : req;
};
const follow = (token, username) => request(app).post(`/api/readers/${username}/follow`).set(auth(token));
const unfollow = (token, username) => request(app).delete(`/api/readers/${username}/follow`).set(auth(token));
const setPrivate = (who, isPrivate) =>
  request(app).put(`/api/users/${who.user.id}/privacy`).set(auth(who.token)).send({ isPrivate });
const getFeed = (token, cursor) =>
  request(app).get("/api/feed").query(cursor ? { cursor } : {}).set(auth(token));

describe("GET /api/readers/:username", () => {
  it("shows a public profile and its books to anyone, without login", async () => {
    const alice = await createUser();
    await addBook(alice.token, { book_id: "b1", title: "Dune", status: "read" });
    await request(app)
      .patch("/api/history/user-books/b1")
      .set(auth(alice.token))
      .send({ rating: 5, review: "Spice!" });

    const res = await getReader(alice.user.username);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      username: alice.user.username,
      isPrivate: false,
      isSelf: false,
      isFollowing: false,
      followerCount: 0,
      followingCount: 0,
    });
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0]).toMatchObject({ title: "Dune", rating: 5, review: "Spice!" });
  });

  it("never exposes email addresses or password hashes", async () => {
    const alice = await createUser();

    const res = await getReader(alice.user.username);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain(alice.user.email);
    expect(body).not.toMatch(/password|\$2[aby]\$/);
  });

  it("returns 404 for an unknown reader", async () => {
    expect((await getReader("nobody_here")).status).toBe(404);
  });

  it("hides a private profile's books from others, but not from its owner", async () => {
    const alice = await createUser();
    const bob = await createUser();
    await addBook(alice.token, { book_id: "b1" });
    await setPrivate(alice, true);

    const asBob = await getReader(alice.user.username, bob.token);
    expect(asBob.body.isPrivate).toBe(true);
    expect(asBob.body.books).toBeNull();
    expect((await getReader(alice.user.username)).body.books).toBeNull();

    const asAlice = await getReader(alice.user.username, alice.token);
    expect(asAlice.body.isSelf).toBe(true);
    expect(asAlice.body.books).toHaveLength(1);
  });

  it("treats an invalid token as a logged-out visitor", async () => {
    const alice = await createUser();
    const res = await getReader(alice.user.username, "not-a-real-token");
    expect(res.status).toBe(200);
    expect(res.body.isSelf).toBe(false);
  });
});

describe("following", () => {
  it("follows and unfollows, updating counts on both sides", async () => {
    const alice = await createUser();
    const bob = await createUser();

    const res = await follow(bob.token, alice.user.username);
    expect(res.body).toEqual({ isFollowing: true, followerCount: 1 });

    const aliceProfile = (await getReader(alice.user.username, bob.token)).body;
    expect(aliceProfile.isFollowing).toBe(true);
    expect(aliceProfile.followerCount).toBe(1);
    expect((await getReader(bob.user.username)).body.followingCount).toBe(1);

    expect((await unfollow(bob.token, alice.user.username)).body).toEqual({
      isFollowing: false,
      followerCount: 0,
    });
  });

  it("is idempotent", async () => {
    const alice = await createUser();
    const bob = await createUser();

    await follow(bob.token, alice.user.username);
    const again = await follow(bob.token, alice.user.username);

    expect(again.status).toBe(200);
    expect(again.body.followerCount).toBe(1);
    expect((await unfollow(bob.token, "nobody_here")).status).toBe(404);
  });

  it("requires login and rejects following yourself", async () => {
    const alice = await createUser();

    expect((await request(app).post(`/api/readers/${alice.user.username}/follow`)).status).toBe(401);
    expect((await follow(alice.token, alice.user.username)).status).toBe(400);
  });

  it("lists followers and following, newest first, respecting privacy", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const carol = await createUser();
    await follow(bob.token, alice.user.username);
    await db.query("UPDATE follows SET created_at = '2020-01-01'");
    await follow(carol.token, alice.user.username);
    await follow(alice.token, carol.user.username);

    const followers = await request(app).get(`/api/readers/${alice.user.username}/followers`);
    expect(followers.body).toEqual([carol.user.username, bob.user.username]);
    const following = await request(app).get(`/api/readers/${alice.user.username}/following`);
    expect(following.body).toEqual([carol.user.username]);

    await setPrivate(alice, true);
    expect((await request(app).get(`/api/readers/${alice.user.username}/followers`)).status).toBe(403);
  });
});

describe("GET /api/readers/search", () => {
  it("finds readers by part of their username, prefix matches first", async () => {
    await createUser({ username: "bookworm", email: "a@example.com" });
    await createUser({ username: "the_bookish_one", email: "b@example.com" });
    await createUser({ username: "unrelated", email: "c@example.com" });

    const res = await request(app).get("/api/readers/search").query({ q: "book" });

    expect(res.body).toEqual(["bookworm", "the_bookish_one"]);
  });

  it("treats _ and % literally", async () => {
    await createUser({ username: "a_b", email: "a@example.com" });
    await createUser({ username: "axb", email: "b@example.com" });

    const res = await request(app).get("/api/readers/search").query({ q: "a_" });

    expect(res.body).toEqual(["a_b"]);
  });

  it("rejects queries that are too short", async () => {
    expect((await request(app).get("/api/readers/search").query({ q: "a" })).status).toBe(400);
  });
});

describe("PUT /api/users/:id/privacy", () => {
  it("only lets users change their own setting, and checks the value", async () => {
    const alice = await createUser();
    const bob = await createUser();

    const forbidden = await request(app)
      .put(`/api/users/${alice.user.id}/privacy`)
      .set(auth(bob.token))
      .send({ isPrivate: true });
    expect(forbidden.status).toBe(403);
    expect((await setPrivate(alice, "yes")).status).toBe(400);
    expect((await setPrivate(alice, true)).body).toEqual({ isPrivate: true });
  });
});

describe("GET /api/feed", () => {
  it("requires login", async () => {
    expect((await request(app).get("/api/feed")).status).toBe(401);
  });

  it("shows activity from followed readers only, newest first", async () => {
    const me = await createUser();
    const alice = await createUser();
    const stranger = await createUser();
    await follow(me.token, alice.user.username);
    await addBook(alice.token, { book_id: "old", title: "Old Book", status: "read" });
    await addBook(alice.token, { book_id: "new", title: "New Book", status: "reading" });
    await addBook(stranger.token, { book_id: "s1", title: "Stranger Book" });
    await addBook(me.token, { book_id: "mine", title: "My Book" });
    await db.query("UPDATE user_books SET updated_at = '2024-01-01' WHERE book_id = 'old'");

    const res = await getFeed(me.token);

    expect(res.status).toBe(200);
    expect(res.body.items.map((i) => i.title)).toEqual(["New Book", "Old Book"]);
    expect(res.body.items[0]).toMatchObject({
      username: alice.user.username,
      status: "reading",
      book_id: "new",
    });
    expect(res.body.items[0]).not.toHaveProperty("id");
    expect(res.body.nextCursor).toBeNull();
  });

  it("leaves out readers who made their profile private", async () => {
    const me = await createUser();
    const alice = await createUser();
    await follow(me.token, alice.user.username);
    await addBook(alice.token);
    await setPrivate(alice, true);

    expect((await getFeed(me.token)).body.items).toEqual([]);
  });

  it("pages through items with a cursor, including ties on the same timestamp", async () => {
    const me = await createUser();
    const alice = await createUser();
    await follow(me.token, alice.user.username);
    for (let i = 0; i < 25; i++) {
      await addBook(alice.token, { book_id: `b${i}`, title: `Book ${i}` });
    }
    // Every item changed in the same second, so only the id orders them
    await db.query("UPDATE user_books SET updated_at = '2025-06-01 12:00:00'");

    const first = await getFeed(me.token);
    expect(first.body.items).toHaveLength(20);
    expect(first.body.nextCursor).toEqual(expect.any(String));

    const second = await getFeed(me.token, first.body.nextCursor);
    expect(second.body.items).toHaveLength(5);
    expect(second.body.nextCursor).toBeNull();

    const titles = [...first.body.items, ...second.body.items].map((i) => i.title);
    expect(new Set(titles).size).toBe(25);
  });

  it("rejects a malformed cursor", async () => {
    const me = await createUser();
    expect((await getFeed(me.token, "garbage")).status).toBe(400);
  });
});

describe("timestamps", () => {
  it("come back in UTC whatever the database server's time zone", async () => {
    const me = await createUser();
    const alice = await createUser();
    await follow(me.token, alice.user.username);
    await addBook(alice.token);

    const { activity_at } = (await getFeed(me.token)).body.items[0];

    // Just created, so it should be within a minute of now (not hours off)
    expect(Math.abs(new Date(activity_at).getTime() - Date.now())).toBeLessThan(60 * 1000);
  });
});
