const express = require("express");
const router = express.Router();
const axios = require("axios");

const KEY = process.env.GOOGLE_BOOKS_API_KEY;

// Get books by genre
router.get("/:genre", async (req, res) => {
    const genre = req.params.genre;
  
    try {
      const response = await axios.get("https://www.googleapis.com/books/v1/volumes", {
        params: {
          q: `subject:${genre}`,
          maxResults: 14,
          orderBy: "relevance",
          key: KEY,
        },
      });
  
      const books = response.data.items.map((book) => {
        const info = book.volumeInfo;
        return {
          id: book.id,
          title: info.title,
          author: info.authors ? info.authors[0] : "Unknown",
          coverImage: info.imageLinks?.thumbnail || null,
          genre: genre,
          description: info.description || "",
          link: info.infoLink || "",
        };
      });
  
      res.json(books);
    } catch (error) {
      console.error(`Error fetching ${genre} books:`, error.message);
      res.status(500).json({ error: `Failed to fetch ${genre} books` });
    }
  });
  
  module.exports = router;
