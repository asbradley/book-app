const { app, db, request, resetDb, createUser, addBook } = require("./helpers");

beforeEach(resetDb);
afterAll(() => db.end());

const getReviews = (bookId) => request(app).get(`/api/books/${bookId}/reviews`);
const rate = (who, bookId, body) =>
  request(app)
    .patch(`/api/history/user-books/${bookId}`)
    .set("Authorization", `Bearer ${who.token}`)
    .send(body);

it("summarizes ratings and lists reviews, newest first, without login", async () => {
  const alice = await createUser();
  const bob = await createUser();
  const carol = await createUser();
  for (const reader of [alice, bob, carol]) await addBook(reader.token, { book_id: "dune" });
  await rate(alice, "dune", { rating: 5, review: "Masterpiece" });
  await rate(bob, "dune", { rating: 4, review: "Slow start" });
  await rate(carol, "dune", { rating: 4 }); // rated but no written review
  await db.query("UPDATE user_books SET updated_at = '2024-01-01' WHERE user_id = ?", [alice.user.id]);

  const res = await getReviews("dune");

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ readerCount: 3, ratingCount: 3, averageRating: 4.3 });
  expect(res.body.reviews.map((r) => [r.username, r.review])).toEqual([
    [bob.user.username, "Slow start"],
    [alice.user.username, "Masterpiece"],
  ]);
});

it("leaves out private readers entirely", async () => {
  const alice = await createUser();
  const secret = await createUser();
  await addBook(alice.token, { book_id: "dune" });
  await addBook(secret.token, { book_id: "dune" });
  await rate(secret, "dune", { rating: 1, review: "Private opinion" });
  await request(app)
    .put(`/api/users/${secret.user.id}/privacy`)
    .set("Authorization", `Bearer ${secret.token}`)
    .send({ isPrivate: true });

  const { body } = await getReviews("dune");

  expect(body).toEqual({ readerCount: 1, ratingCount: 0, averageRating: null, reviews: [] });
});

it("returns an empty summary for a book nobody has shelved", async () => {
  const { body } = await getReviews("unknown-book");
  expect(body).toEqual({ readerCount: 0, ratingCount: 0, averageRating: null, reviews: [] });
});

it("never includes email addresses", async () => {
  const alice = await createUser();
  await addBook(alice.token, { book_id: "dune" });
  await rate(alice, "dune", { review: "Good" });

  expect(JSON.stringify((await getReviews("dune")).body)).not.toContain(alice.user.email);
});
