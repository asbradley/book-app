// Recommendations tests. OpenAI and Google Books are mocked (no network calls,
// no cost); the database and routes are real.
jest.mock("axios");
const axios = require("axios");
const { app, db, request, resetDb, createUser, addBook } = require("./helpers");

beforeEach(resetDb);
afterAll(() => db.end());

// Fake Google Books catalog, keyed by the title in the search query.
// "Mistborn" deliberately returns other books in the series first, like the
// real API does, to check that the exact title match is picked.
const mistbornResults = [
  { id: "bands", volumeInfo: { title: "The Bands of Mourning", authors: ["Brandon Sanderson"] } },
  { id: "trilogy", volumeInfo: { title: "Mistborn Trilogy", authors: ["Brandon Sanderson"] } },
  {
    id: "mistborn",
    volumeInfo: {
      title: "Mistborn",
      subtitle: "The Final Empire",
      authors: ["Brandon Sanderson"],
      imageLinks: { thumbnail: "http://img/mistborn.jpg" },
    },
  },
];
const catalog = {
  "The Name of the Wind": [
    {
      id: "wind",
      volumeInfo: {
        title: "The Name of the Wind",
        authors: ["Patrick Rothfuss"],
        imageLinks: { thumbnail: "http://img/wind.jpg" },
        description: "A legend's story",
        infoLink: "http://books/wind",
      },
    },
  ],
  Mistborn: mistbornResults,
  "Mistborn: The Final Empire": mistbornResults,
  // A different edition of a book the user already has (different ID)
  Dune: [{ id: "dune-other-edition", volumeInfo: { title: "Dune", authors: ["Frank Herbert"] } }],
};

const suggestions = [
  { title: "The Name of the Wind", author: "Patrick Rothfuss", reason: "Epic fantasy like Dune" },
  { title: "Mistborn", author: "Brandon Sanderson", reason: "Rich world-building" },
  { title: "Mistborn: The Final Empire", author: "Brandon Sanderson", reason: "Same book again" },
  { title: "The Imaginary Book", author: "Nobody", reason: "Hallucinated" },
  { title: "Dune", author: "Frank Herbert", reason: "Already on the shelf" },
];

function mockOpenAi(recommendations) {
  axios.post.mockResolvedValue({
    data: {
      choices: [{ message: { refusal: null, content: JSON.stringify({ recommendations }) } }],
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOpenAi(suggestions);
  axios.get.mockImplementation(async (_url, { params }) => {
    const title = params.q.match(/intitle:(.*) inauthor:/)[1];
    return { data: { items: catalog[title] } };
  });
});

const getRecs = (token, query = "") =>
  request(app).get(`/api/history/recommendations${query}`).set("Authorization", `Bearer ${token}`);

it("returns an empty list without calling OpenAI when the user has no books", async () => {
  const { token } = await createUser();

  const res = await getRecs(token);

  expect(res.status).toBe(200);
  expect(res.body.recommendations).toEqual([]);
  expect(axios.post).not.toHaveBeenCalled();
});

it("returns verified, de-duplicated books with the AI's reasons", async () => {
  const { token } = await createUser();
  await addBook(token); // Dune

  const res = await getRecs(token);

  expect(res.status).toBe(200);
  // Hallucinated book dropped, Mistborn resolved to the right volume and
  // de-duplicated, and Dune excluded even though the edition differs
  expect(res.body.recommendations.map((b) => b.id)).toEqual(["wind", "mistborn"]);
  expect(res.body.recommendations[0]).toEqual({
    id: "wind",
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    coverImage: "http://img/wind.jpg",
    description: "A legend's story",
    link: "http://books/wind",
    reason: "Epic fantasy like Dune",
  });
});

it("sends a structured-output request that includes shelves and ratings", async () => {
  const { token } = await createUser();
  await addBook(token);
  await addBook(token, { book_id: "vol2", title: "Hyperion", author: "Dan Simmons", status: "want_to_read" });
  await request(app)
    .patch("/api/history/user-books/vol1")
    .set("Authorization", `Bearer ${token}`)
    .send({ rating: 5 });

  await getRecs(token);

  const body = axios.post.mock.calls[0][1];
  expect(body.response_format.type).toBe("json_schema");
  const prompt = body.messages.find((m) => m.role === "user").content;
  expect(prompt).toContain("Dune by Frank Herbert [read, rated 5/5]");
  expect(prompt).toContain("Hyperion by Dan Simmons [want to read]");
});

it("caches results until the user's shelves change or they ask for a refresh", async () => {
  const { token } = await createUser();
  await addBook(token);

  await getRecs(token);
  await getRecs(token);
  expect(axios.post).toHaveBeenCalledTimes(1); // second call served from cache

  await addBook(token, { book_id: "vol2", title: "Hyperion" });
  await getRecs(token);
  expect(axios.post).toHaveBeenCalledTimes(2); // shelves changed

  await getRecs(token, "?refresh=true");
  expect(axios.post).toHaveBeenCalledTimes(3); // explicit refresh
});

it("returns no recommendations when the model refuses", async () => {
  const { token } = await createUser();
  await addBook(token);
  axios.post.mockResolvedValue({
    data: { choices: [{ message: { refusal: "I can't help with that", content: null } }] },
  });

  const res = await getRecs(token);

  expect(res.status).toBe(200);
  expect(res.body.recommendations).toEqual([]);
});

it("reports an exhausted OpenAI balance as 503, not as a rate limit", async () => {
  // The route logs the upstream error; keep expected noise out of test output
  const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const { token } = await createUser();
  await addBook(token);
  axios.post.mockRejectedValue({
    response: { status: 429, data: { error: { type: "insufficient_quota" } } },
  });

  const res = await getRecs(token);

  expect(res.status).toBe(503);
  logSpy.mockRestore();
});

it("passes a genuine rate limit through as 429", async () => {
  // The route logs the upstream error; keep expected noise out of test output
  const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const { token } = await createUser();
  await addBook(token);
  axios.post.mockRejectedValue({
    response: { status: 429, data: { error: { type: "requests" } } },
  });

  const res = await getRecs(token);

  expect(res.status).toBe(429);
  logSpy.mockRestore();
});
