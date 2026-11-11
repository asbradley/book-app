const express = require("express");
const { searchBooks } = require("../utils/googleBooks");

const router = express.Router();

// Get books by genre
router.get("/:genre", async (req, res) => {
  const genre = req.params.genre;

  try {
    const books = await searchBooks(`subject:${genre}`, {
      maxResults: 14,
      orderBy: "relevance",
    });
    res.json(books.map((book) => ({ ...book, genre })));
  } catch (error) {
    console.error(`Error fetching ${genre} books:`, error.message);
    res.status(500).json({ error: `Failed to fetch ${genre} books` });
  }
});

module.exports = router;
