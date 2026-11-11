const express = require("express");
const { searchBooks } = require("../utils/googleBooks");

const router = express.Router();

const HOME_PAGE_GENRES = ["Romance", "Fantasy", "Mystery", "Science Fiction"];
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

// Get books for the home page: a few from each of several genres
router.get("/", async (req, res) => {
  try {
    // Fetch all genres in parallel, limiting to 7 per genre for faster loading
    const booksByGenre = await Promise.all(
      HOME_PAGE_GENRES.map(async (genre) => {
        const books = await searchBooks(`subject:${genre}`, {
          maxResults: 7,
          orderBy: "relevance",
        });
        return books.map((book) => ({ ...book, genre }));
      })
    );

    // Flatten array of arrays into a single array of books
    res.json(booksByGenre.flat());
  } catch (error) {
    console.error("Error fetching books:", error.message);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Public search used by the header search bar (no login required).
// GET /api/books/search?q=dune
router.get("/search", async (req, res) => {
  const query = (req.query.q || "").trim();

  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({
      message: `Search must be between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters`,
    });
  }

  try {
    res.json(await searchBooks(query, { maxResults: 20 }));
  } catch (error) {
    console.error("Error searching books:", error.message);
    res.status(500).json({ error: "Failed to search books" });
  }
});

module.exports = router;
