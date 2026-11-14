const express = require("express");
const { searchBooks } = require("../utils/googleBooks");
const db = require("../database/db");

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

const MAX_REVIEWS = 20;

// What readers think of a book: average rating, how many readers have it on
// their shelves, and the most recent written reviews. Only public profiles
// are counted, so private readers' ratings stay private.
// GET /api/books/:bookId/reviews (no login required)
router.get("/:bookId/reviews", async (req, res) => {
  const { bookId } = req.params;
  if (bookId.length > 255) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  const publicReaders = `FROM user_books ub JOIN users u ON u.id = ub.user_id
                         WHERE ub.book_id = ? AND u.is_private = FALSE`;

  try {
    const [[[summary]], [reviews]] = await Promise.all([
      db.execute(
        `SELECT COUNT(*) AS readerCount, COUNT(ub.rating) AS ratingCount, AVG(ub.rating) AS averageRating
         ${publicReaders}`,
        [bookId]
      ),
      db.execute(
        `SELECT u.username, ub.rating, ub.review, ub.updated_at
         ${publicReaders} AND ub.review IS NOT NULL
         ORDER BY ub.updated_at DESC
         LIMIT ${MAX_REVIEWS}`,
        [bookId]
      ),
    ]);

    res.json({
      readerCount: summary.readerCount,
      ratingCount: summary.ratingCount,
      // AVG comes back as a decimal string; round to one place
      averageRating: summary.averageRating === null ? null : Math.round(summary.averageRating * 10) / 10,
      reviews,
    });
  } catch (error) {
    console.error("Error loading book reviews:", error);
    res.status(500).json({ message: "Failed to load reviews" });
  }
});

module.exports = router;
