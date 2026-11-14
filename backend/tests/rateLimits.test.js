// Rate limits are off for the rest of the suite (see testEnv.js) and switched
// on here only around the requests being tested, so setup calls like
// createUser() aren't counted. Jest gives each test file its own module
// instances, so these counters start at zero and don't affect other files.
// Every request comes from the same IP, so each limiter is used by one test.
jest.mock("axios");
const axios = require("axios");
const { app, db, request, resetDb, createUser } = require("./helpers");

beforeAll(resetDb);
afterAll(() => db.end());

async function withLimits(fn) {
  process.env.DISABLE_RATE_LIMITS = "false";
  try {
    await fn();
  } finally {
    process.env.DISABLE_RATE_LIMITS = "true";
  }
}

it("blocks login after 10 failed attempts, without counting successful ones", async () => {
  const { user, password } = await createUser();
  const login = (pw) => request(app).post("/api/auth/login").send({ email: user.email, password: pw });

  await withLimits(async () => {
    for (let i = 0; i < 9; i++) {
      expect((await login("wrong-password")).status).toBe(401);
    }
    for (let i = 0; i < 3; i++) {
      expect((await login(password)).status).toBe(200);
    }
    expect((await login("wrong-password")).status).toBe(401); // 10th failure

    // Now even the right password is refused until the window passes
    const blocked = await login(password);
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/too many failed login attempts/i);
    expect(blocked.headers["retry-after"]).toBeDefined();
  });
});

it("limits registrations to 10 per hour per IP", async () => {
  const register = (n) =>
    request(app)
      .post("/api/auth/register")
      .send({ username: `limit${n}`, email: `limit${n}@example.com`, password: "password123" });

  await withLimits(async () => {
    for (let i = 0; i < 10; i++) {
      expect((await register(i)).status).toBe(201);
    }
    expect((await register(10)).status).toBe(429);
  });
});

it("limits book searches to 60 per minute per IP", async () => {
  axios.get.mockResolvedValue({ data: { items: [] } });

  await withLimits(async () => {
    for (let i = 0; i < 60; i++) {
      expect((await request(app).get("/api/books/search").query({ q: `query ${i}` })).status).toBe(200);
    }
    // Genre pages share the same budget
    expect((await request(app).get("/api/genre/Fantasy")).status).toBe(429);
  });
});

it("limits recommendations per user, not per IP", async () => {
  const alice = await createUser();
  const bob = await createUser();
  // Users with no books get an empty list without calling OpenAI
  const getRecs = (token) =>
    request(app).get("/api/history/recommendations").set("Authorization", `Bearer ${token}`);

  await withLimits(async () => {
    for (let i = 0; i < 20; i++) {
      expect((await getRecs(alice.token)).status).toBe(200);
    }
    expect((await getRecs(alice.token)).status).toBe(429);
    expect((await getRecs(bob.token)).status).toBe(200);
  });
});
