const express = require("express")
const axios = require("axios")

const router = express.Router();

const KEY = process.env.GOOGLE_BOOKS_API_KEY;


// Get all books from multiple genres
router.get("/", async (req, res) => {
  const genres = ["Romance", "Fantasy", "Mystery", "Science Fiction"];
  try {
    const booksPromises = genres.map(async (genre) => {
      const response = await axios.get("https://www.googleapis.com/books/v1/volumes", {
        params: {
          q: `subject:${genre}`,
          maxResults: 7, // Limiting to 6 per genre for faster loading
          orderBy: "relevance",
          key: KEY,
        },
      });

      return response.data.items.map((book) => {
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
    });

    const booksArrays = await Promise.all(booksPromises);
    const allBooks = booksArrays.flat();

    res.json(allBooks);
  } catch (error) {
    console.error("Error fetching books:", error.message);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});
// Get books by genre
router.get("/:genre", async (req, res) => {
  const genre = req.params.genre;
  
  try {
    const response = await axios.get("https://www.googleapis.com/books/v1/volumes", {
      params: {
        q: `subject:${genre}`,
        maxResults: 10,
        orderBy: "relevance",
        key: KEY,
      },
    });

    const books = response.data.items.map((book) => {
      const info = book.volumeInfo;
      return {
        id: book.id,
        title: info.title,
        author: info.authors ? info.authors[0] : "Unknown", // Using single author for simplicity
        coverImage: info.imageLinks?.thumbnail || null,
        genre: genre, // Add the genre
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