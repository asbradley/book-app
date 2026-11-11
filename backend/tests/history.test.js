const { app, db, request, resetDb, createUser, addBook } = require("./helpers");

beforeEach(resetDb);
afterAll(() => db.end());

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe("authentication", () => {
  it.each([
    ["get", "/api/history/user-books"],
    ["post", "/api/history/user-books"],
    ["patch", "/api/history/user-books/vol1"],
    ["delete", "/api/history/user-books/vol1"],
    ["get", "/api/history/recommendations"],
    ["get", "/api/history/user-search?q=dune"],
  ])("%s %s requires a token", async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/history/user-books", () => {
  it("saves a book and returns the stored row, defaulting to the Read shelf", async () => {
    const { token, user } = await createUser();

    const res = await addBook(token, { cover_image: "http://img/dune.jpg" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      user_id: user.id,
      book_id: "vol1",
      title: "Dune",
      cover_image: "http://img/dune.jpg",
      status: "read",
      rating: null,
      review: null,
    });
  });

  it("ignores a user_id in the body and uses the token's user", async () => {
    const alice = await createUser();
    const bob = await createUser();

    const res = await addBook(alice.token, { user_id: bob.user.id });

    expect(res.body.user_id).toBe(alice.user.id);
  });

  it("accepts a shelf and rejects an unknown one", async () => {
    const { token } = await createUser();

    expect((await addBook(token, { status: "want_to_read" })).body.status).toBe("want_to_read");
    expect((await addBook(token, { book_id: "vol2", status: "finished" })).status).toBe(400);
  });

  it("rejects missing fields and duplicates", async () => {
    const { token } = await createUser();

    expect((await addBook(token, { title: "" })).status).toBe(400);
    await addBook(token);
    expect((await addBook(token)).status).toBe(409);
  });
});

describe("GET /api/history/user-books", () => {
  it("returns only the current user's books, newest first", async () => {
    const alice = await createUser();
    const bob = await createUser();
    await addBook(alice.token, { book_id: "a1", title: "First" });
    // created_at has 1-second resolution, so make the ordering explicit
    await db.query("UPDATE user_books SET created_at = NOW() - INTERVAL 1 MINUTE");
    await addBook(alice.token, { book_id: "a2", title: "Second" });
    await addBook(bob.token, { book_id: "b1", title: "Bob's book" });

    const res = await request(app).get("/api/history/user-books").set(auth(alice.token));

    expect(res.status).toBe(200);
    expect(res.body.map((b) => b.book_id)).toEqual(["a2", "a1"]);
  });
});

describe("PATCH /api/history/user-books/:bookId", () => {
  const patch = (token, body, bookId = "vol1") =>
    request(app).patch(`/api/history/user-books/${bookId}`).set(auth(token)).send(body);

  it("updates shelf, rating and review, trimming the review", async () => {
    const { token } = await createUser();
    await addBook(token);

    const res = await patch(token, { status: "reading", rating: 4, review: "  Loved it  " });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "reading", rating: 4, review: "Loved it" });
  });

  it("only changes the fields that are sent", async () => {
    const { token } = await createUser();
    await addBook(token);
    await patch(token, { rating: 5, review: "Great" });

    const res = await patch(token, { status: "want_to_read" });

    expect(res.body).toMatchObject({ status: "want_to_read", rating: 5, review: "Great" });
  });

  it("clears a rating with null and a review with an empty string", async () => {
    const { token } = await createUser();
    await addBook(token);
    await patch(token, { rating: 3, review: "Fine" });

    const res = await patch(token, { rating: null, review: "" });

    expect(res.body).toMatchObject({ rating: null, review: null });
  });

  it.each([
    ["an unknown shelf", { status: "finished" }],
    ["a rating above 5", { rating: 6 }],
    ["a rating below 1", { rating: 0 }],
    ["a fractional rating", { rating: 2.5 }],
    ["a rating sent as text", { rating: "5" }],
    ["a non-text review", { review: 42 }],
    ["a review that is too long", { review: "x".repeat(5001) }],
    ["no fields at all", {}],
  ])("rejects %s with 400", async (_case, body) => {
    const { token } = await createUser();
    await addBook(token);

    expect((await patch(token, body)).status).toBe(400);
  });

  it("returns 404 for a book that isn't on the user's list", async () => {
    const { token } = await createUser();
    expect((await patch(token, { rating: 3 }, "missing")).status).toBe(404);
  });

  it("can't modify another user's book", async () => {
    const alice = await createUser();
    const bob = await createUser();
    await addBook(alice.token);

    const res = await patch(bob.token, { rating: 1 });

    expect(res.status).toBe(404);
    const [[row]] = await db.query("SELECT rating FROM user_books WHERE user_id = ?", [alice.user.id]);
    expect(row.rating).toBeNull();
  });
});

describe("DELETE /api/history/user-books/:bookId", () => {
  it("removes the book", async () => {
    const { token } = await createUser();
    await addBook(token);

    const res = await request(app).delete("/api/history/user-books/vol1").set(auth(token));

    expect(res.status).toBe(204);
    const list = await request(app).get("/api/history/user-books").set(auth(token));
    expect(list.body).toEqual([]);
  });

  it("returns 404 when the book isn't on the list", async () => {
    const { token } = await createUser();
    const res = await request(app).delete("/api/history/user-books/vol1").set(auth(token));
    expect(res.status).toBe(404);
  });

  it("can't delete another user's book", async () => {
    const alice = await createUser();
    const bob = await createUser();
    await addBook(alice.token);

    const res = await request(app).delete("/api/history/user-books/vol1").set(auth(bob.token));

    expect(res.status).toBe(404);
    const [rows] = await db.query("SELECT id FROM user_books WHERE user_id = ?", [alice.user.id]);
    expect(rows).toHaveLength(1);
  });
});
