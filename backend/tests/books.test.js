// Public book routes (home page, genre, search). Google Books is mocked;
// these routes don't touch the database.
jest.mock("axios");
const axios = require("axios");
const { app, db, request } = require("./helpers");

afterAll(() => db.end());

const volume = (id, title, extra = {}) => ({
  id,
  volumeInfo: {
    title,
    authors: ["Some Author"],
    imageLinks: { thumbnail: `http://img/${id}.jpg` },
    description: `About ${title}`,
    infoLink: `http://books/${id}`,
    ...extra,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  axios.get.mockResolvedValue({ data: { items: [volume("v1", "Dune")] } });
});

describe("GET /api/books/search", () => {
  it("returns matching books in the frontend's shape, without requiring login", async () => {
    const res = await request(app).get("/api/books/search").query({ q: "dune" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: "v1",
        title: "Dune",
        author: "Some Author",
        coverImage: "http://img/v1.jpg",
        description: "About Dune",
        link: "http://books/v1",
      },
    ]);
    expect(axios.get.mock.calls[0][1].params).toMatchObject({ q: "dune", maxResults: 20 });
  });

  it("returns an empty list when Google finds nothing (it omits `items`)", async () => {
    axios.get.mockResolvedValue({ data: { totalItems: 0 } });

    const res = await request(app).get("/api/books/search").query({ q: "zzzzqqqq" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("fills in defaults for volumes missing optional fields", async () => {
    axios.get.mockResolvedValue({ data: { items: [{ id: "bare", volumeInfo: { title: "Bare" } }] } });

    const res = await request(app).get("/api/books/search").query({ q: "bare" });

    expect(res.body[0]).toEqual({
      id: "bare",
      title: "Bare",
      author: "Unknown",
      coverImage: null,
      description: "",
      link: "",
    });
  });

  it.each([
    ["missing", undefined],
    ["too short", "a"],
    ["only spaces", "   "],
    ["too long", "x".repeat(101)],
  ])("rejects a %s query with 400", async (_case, q) => {
    const res = await request(app).get("/api/books/search").query(q === undefined ? {} : { q });
    expect(res.status).toBe(400);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("returns 500 when Google Books fails", async () => {
    axios.get.mockRejectedValue(new Error("network down"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app).get("/api/books/search").query({ q: "dune" });

    expect(res.status).toBe(500);
    console.error.mockRestore();
  });
});

describe("GET /api/books", () => {
  it("returns books from each home page genre, tagged with their genre", async () => {
    axios.get.mockImplementation(async (_url, { params }) => ({
      data: { items: [volume(params.q, `A ${params.q} book`)] },
    }));

    const res = await request(app).get("/api/books");

    expect(res.status).toBe(200);
    expect(res.body.map((b) => b.genre)).toEqual(["Romance", "Fantasy", "Mystery", "Science Fiction"]);
    expect(res.body[1].title).toBe("A subject:Fantasy book");
  });
});

describe("GET /api/genre/:genre", () => {
  it("searches by subject and tags each book with the genre", async () => {
    const res = await request(app).get("/api/genre/Science%20Fiction");

    expect(res.status).toBe(200);
    expect(axios.get.mock.calls[0][1].params.q).toBe("subject:Science Fiction");
    expect(res.body[0]).toMatchObject({ id: "v1", genre: "Science Fiction" });
  });

  it("returns an empty list for a genre with no books", async () => {
    axios.get.mockResolvedValue({ data: {} });

    const res = await request(app).get("/api/genre/Nothing");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
