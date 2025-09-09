const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const axios = require("axios")
const KEY = process.env.GOOGLE_BOOKS_API_KEY;
const db = require("../../database/db")

// Get the frontend API request for the user profile history section.
router.get("/user-search", async (req, res) => {
  const que = req.query.q;

  // Validate query and its length
  if (!que || que.length < 3) {
    return res
      .status(400)
      .json({ message: "Query must be 3 characters minimum" });
  }

  // Allow user to search by author or title
  const googleSearchQuery = `intitle:${que} OR inauthor:${que}`;

  // Send Google Books API request to get matching books based on title/author
  try {
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: googleSearchQuery,
          key: KEY,
          maxResults: 8,
        },
      }
    );

    // Return the data to the frontend
    const books = response.data.items.map((book) => {
      const info = book.volumeInfo;
      return {
        id: book.id,
        title: info.title,
        author: info.authors ? info.authors[0] : "Unknown",
        coverImage: info.imageLinks?.thumbnail || null,
      };
    });

    res.json(books);
  } catch (error) {
    console.error(
      "Error getting books:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to search books" });
  }
});


// Route to save a book to the user's history list after adding it
router.post("/user-books", async(req, res) => {
  const { user_id, book_id, title, author, cover_image} = req.body;

  // Validation
  if (!user_id || !book_id || !title) {
    return res.status(400).json({ message: "Missing field "})
  }

  try {
    const query = `
      INSERT INTO user_books (user_id, book_id, title, author, cover_image)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.execute(query, [user_id, book_id, title, author, cover_image])
    res.status(201).json({ message: "Book saved success!"})

  } catch (error) {
    if (error.code == `ER_DUP_ENTRY`) {
      return res.status(409).json({message: "Book already saved"})
    }

    console.error("Error saving book:", error);
    res.status(500).json({message: "Failed to save deh book!"})
  }
})


// Route to get users history list
router.get("/user-books", async(req, res) => {
  const { user_id } = req.query;
  const query = `
    SELECT * FROM user_books WHERE user_id = ?
  `;
  
  try {
  const [rows] = await db.execute(query, [user_id]);
  res.json(rows);

  } catch (error) {
    console.error("Error getting user books:", error);
    res.status(500).json({message: "Failed to get user books"})
  }
})

// Route to get book recommendations
router.get("/recommendations", async (req, res) => {
  const { user_id } = req.query;

  try {
    // Step 1: fetch books
    const [rows] = await db.execute(
      "SELECT title FROM user_books WHERE user_id = ?",
      [user_id]
    );

    if (rows.length === 0) {
      return res.json({ recommendations: [] });
    }

    const bookTitles = rows.map(b => b.title).join(", ");
    const prompt = `Recommend 5 books similar to these: ${bookTitles}.
                    Return only titles in a JSON array.`;

    // Step 2: call OpenAI
    const openAiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
        },
      }
    );

    const text = openAiResponse.data.choices[0].message.content;
    let recommendations = [];
    try {
      recommendations = JSON.parse(text);
    } catch {
      recommendations = [];
    }

    res.json({ recommendations });
  } catch (error) {
    console.error("Error getting recommendations:", error?.response?.data || error);

    if (error.response && error.response.status === 429) {
      return res
        .status(429)
        .json({ message: "Rate limited by OpenAI. Please try again later." });
    }

    res.status(500).json({ message: "Failed to get recommendations" });
  }
});




module.exports = router;
