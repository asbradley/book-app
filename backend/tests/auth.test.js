const { app, db, request, resetDb, createUser } = require("./helpers");

beforeEach(resetDb);
afterAll(() => db.end());

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "alice", email: "alice@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ username: "alice", email: "alice@example.com" });
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("stores a bcrypt hash, never the plain password", async () => {
    await createUser({ username: "bob", email: "bob@example.com", password: "secret123" });

    const [[row]] = await db.query("SELECT password FROM users WHERE username = 'bob'");
    expect(row.password).not.toBe("secret123");
    expect(row.password).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
  });

  it.each([
    ["a missing field", { username: "carol", email: "carol@example.com" }],
    ["a short username", { username: "ab", email: "ab@example.com", password: "password123" }],
    ["a username with symbols", { username: "bad name!", email: "x@example.com", password: "password123" }],
    ["an invalid email", { username: "carol", email: "not-an-email", password: "password123" }],
    ["a short password", { username: "carol", email: "carol@example.com", password: "123" }],
  ])("rejects %s with 400", async (_case, body) => {
    const res = await request(app).post("/api/auth/register").send(body);
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email or username with 409", async () => {
    await createUser({ username: "dave", email: "dave@example.com" });

    const sameEmail = await request(app)
      .post("/api/auth/register")
      .send({ username: "dave2", email: "dave@example.com", password: "password123" });
    const sameUsername = await request(app)
      .post("/api/auth/register")
      .send({ username: "dave", email: "other@example.com", password: "password123" });

    expect(sameEmail.status).toBe(409);
    expect(sameUsername.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token for the right password", async () => {
    const { user, password } = await createUser();

    const res = await request(app).post("/api/auth/login").send({ email: user.email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.id).toBe(user.id);
  });

  it("returns the same 401 for a wrong password and an unknown email", async () => {
    const { user } = await createUser();

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrong-password" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    // Identical responses so attackers can't tell which emails are registered
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe("GET /api/auth/verify", () => {
  it("accepts a valid token", async () => {
    const { token } = await createUser();
    const res = await request(app).get("/api/auth/verify").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("rejects a missing or invalid token", async () => {
    expect((await request(app).get("/api/auth/verify")).status).toBe(401);
    const bad = await request(app).get("/api/auth/verify").set("Authorization", "Bearer garbage");
    expect(bad.status).toBe(403);
  });
});

describe("PUT /api/users/:id", () => {
  it("lets a user update their own profile", async () => {
    const { token, user } = await createUser();

    const res = await request(app)
      .put(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "renamed", email: user.email });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("renamed");
  });

  it("forbids updating someone else's profile", async () => {
    const alice = await createUser();
    const bob = await createUser();

    const res = await request(app)
      .put(`/api/users/${bob.user.id}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ username: "hijacked", email: bob.user.email });

    expect(res.status).toBe(403);
  });

  it("requires the current password to change the password", async () => {
    const { token, user } = await createUser();

    const res = await request(app)
      .put(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ username: user.username, email: user.email, password: "newpass123", oldPassword: "wrong" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/health", () => {
  it("reports the database as connected without returning any data", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "connected" });
  });
});
