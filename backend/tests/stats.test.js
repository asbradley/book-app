const { app, db, request, resetDb, createUser, addBook } = require("./helpers");

beforeEach(resetDb);
afterAll(() => db.end());

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const getStats = (token) => request(app).get("/api/history/stats").set(auth(token));
const patchBook = (token, bookId, body) =>
  request(app).patch(`/api/history/user-books/${bookId}`).set(auth(token)).send(body);
const finishedAt = async (bookId) =>
  (await db.query("SELECT finished_at FROM user_books WHERE book_id = ?", [bookId]))[0][0].finished_at;

const thisYear = new Date().getFullYear();

describe("finished_at tracking", () => {
  it("is set when a book is added to the Read shelf, and empty otherwise", async () => {
    const { token } = await createUser();
    await addBook(token, { book_id: "read1", status: "read" });
    await addBook(token, { book_id: "want1", status: "want_to_read" });

    expect(await finishedAt("read1")).toBeInstanceOf(Date);
    expect(await finishedAt("want1")).toBeNull();
  });

  it("is set when a book moves to Read and cleared when it moves off", async () => {
    const { token } = await createUser();
    await addBook(token, { book_id: "b1", status: "reading" });

    await patchBook(token, "b1", { status: "read" });
    expect(await finishedAt("b1")).toBeInstanceOf(Date);

    await patchBook(token, "b1", { status: "reading" });
    expect(await finishedAt("b1")).toBeNull();
  });

  it("keeps the original date when an already-read book is saved as Read again", async () => {
    const { token } = await createUser();
    await addBook(token, { book_id: "b1", status: "read" });
    await db.query("UPDATE user_books SET finished_at = '2020-05-01 12:00:00' WHERE book_id = 'b1'");

    await patchBook(token, "b1", { status: "read", rating: 4 });

    expect((await finishedAt("b1")).getFullYear()).toBe(2020);
  });

  it("isn't changed by rating or review edits", async () => {
    const { token } = await createUser();
    await addBook(token, { book_id: "b1", status: "want_to_read" });

    await patchBook(token, "b1", { rating: 5, review: "Can't wait" });

    expect(await finishedAt("b1")).toBeNull();
  });
});

describe("GET /api/history/stats", () => {
  it("requires a token", async () => {
    expect((await request(app).get("/api/history/stats")).status).toBe(401);
  });

  it("returns zeroed stats for a new user", async () => {
    const { token } = await createUser();

    const res = await getStats(token);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      year: thisYear,
      shelves: { want_to_read: 0, reading: 0, read: 0 },
      readThisYear: 0,
      monthly: Array(12).fill(0),
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      ratedCount: 0,
      averageRating: null,
      topAuthors: [],
      goal: null,
    });
  });

  it("summarizes shelves, monthly reads, ratings and authors", async () => {
    const { token } = await createUser();
    await addBook(token, { book_id: "r1", author: "Ursula K. Le Guin", status: "read" });
    await addBook(token, { book_id: "r2", author: "Ursula K. Le Guin", status: "read" });
    await addBook(token, { book_id: "r3", author: "Frank Herbert", status: "read" });
    await addBook(token, { book_id: "old", author: "Frank Herbert", status: "read" });
    await addBook(token, { book_id: "now", status: "reading" });
    await addBook(token, { book_id: "later", status: "want_to_read" });
    // Spread finish dates: two in March, one in July this year, one last year
    await db.query(`UPDATE user_books SET finished_at = '${thisYear}-03-10' WHERE book_id IN ('r1', 'r2')`);
    await db.query(`UPDATE user_books SET finished_at = '${thisYear}-07-04' WHERE book_id = 'r3'`);
    await db.query(`UPDATE user_books SET finished_at = '${thisYear - 1}-12-31' WHERE book_id = 'old'`);
    await patchBook(token, "r1", { rating: 5 });
    await patchBook(token, "r2", { rating: 4 });
    await patchBook(token, "r3", { rating: 4 });

    const { body } = await getStats(token);

    expect(body.shelves).toEqual({ want_to_read: 1, reading: 1, read: 4 });
    expect(body.readThisYear).toBe(3); // last year's book isn't counted
    expect(body.monthly[2]).toBe(2); // March
    expect(body.monthly[6]).toBe(1); // July
    expect(body.monthly.reduce((a, b) => a + b)).toBe(3);
    expect(body.ratings).toEqual({ 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 });
    expect(body.ratedCount).toBe(3);
    expect(body.averageRating).toBe(4.3);
    expect(body.topAuthors).toEqual([
      { author: "Frank Herbert", count: 2 },
      { author: "Ursula K. Le Guin", count: 2 },
    ]);
  });

  it("only counts the current user's books", async () => {
    const alice = await createUser();
    const bob = await createUser();
    await addBook(bob.token, { book_id: "b1", status: "read" });

    const { body } = await getStats(alice.token);

    expect(body.shelves.read).toBe(0);
    expect(body.readThisYear).toBe(0);
  });
});

describe("PUT /api/history/goal", () => {
  const putGoal = (token, target) =>
    request(app).put("/api/history/goal").set(auth(token)).send({ target });

  it("sets, updates and removes this year's goal", async () => {
    const { token } = await createUser();

    expect((await putGoal(token, 12)).body).toEqual({ year: thisYear, goal: 12 });
    expect((await getStats(token)).body.goal).toBe(12);

    await putGoal(token, 30);
    expect((await getStats(token)).body.goal).toBe(30);

    await putGoal(token, null);
    expect((await getStats(token)).body.goal).toBeNull();
  });

  it.each([0, 1001, 2.5, "12", undefined])("rejects a target of %p", async (target) => {
    const { token } = await createUser();
    expect((await putGoal(token, target)).status).toBe(400);
  });

  it("keeps each user's goal separate", async () => {
    const alice = await createUser();
    const bob = await createUser();

    await putGoal(alice.token, 10);

    expect((await getStats(bob.token)).body.goal).toBeNull();
  });
});
