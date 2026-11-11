const express = require("express");
const router = express.Router();
const db = require("../../database/db")
const { searchBooks } = require("../../utils/googleBooks");
const { authenticateToken } = require("../../middleware/authMiddleware");
const { getRecommendations } = require("../../services/recommendations");

// Every history route is user-specific, so require a valid JWT for all of them.
// The user's ID always comes from the verified token (req.user.userId), never
// from the request body/query, so a user can only read/write their own data.
router.use(authenticateToken);

// Shelves a book can be on (matches the ENUM on user_books.status)
const STATUSES = ["want_to_read", "reading", "read"];
const MAX_REVIEW_LENGTH = 5000;

// Fetches one of the user's saved books by its Google Books ID
async function getUserBook(userId, bookId) {
  const [rows] = await db.execute(
    "SELECT * FROM user_books WHERE user_id = ? AND book_id = ?",
    [userId, bookId]
  );
  return rows[0];
}

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

  try {
    const books = await searchBooks(googleSearchQuery, { maxResults: 8 });
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
  const user_id = req.user.userId;
  const { book_id, title, author, cover_image, status = "read" } = req.body;

  // Validation
  if (!book_id || !title) {
    return res.status(400).json({ message: "Missing field "})
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    // Books added straight to the "read" shelf count as finished today
    const query = `
      INSERT INTO user_books (user_id, book_id, title, author, cover_image, status, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, IF(? = 'read', CURRENT_TIMESTAMP, NULL))
    `;

    await db.execute(query, [user_id, book_id, title, author ?? null, cover_image ?? null, status, status])

    // Return the saved row so the client renders exactly what's in the database
    res.status(201).json(await getUserBook(user_id, book_id));

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
  const user_id = req.user.userId;
  const query = `
    SELECT * FROM user_books WHERE user_id = ? ORDER BY created_at DESC
  `;
  
  try {
  const [rows] = await db.execute(query, [user_id]);
  res.json(rows);

  } catch (error) {
    console.error("Error getting user books:", error);
    res.status(500).json({message: "Failed to get user books"})
  }
})

// Update a saved book's shelf, rating and/or review.
// Body may contain any of: { status, rating (1-5 or null), review (string or null) }.
// Returns the updated row.
router.patch("/user-books/:bookId", async (req, res) => {
  const user_id = req.user.userId;
  const { bookId } = req.params;
  const updates = {};

  if ("status" in req.body) {
    if (!STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    updates.status = req.body.status;
  }

  if ("rating" in req.body) {
    const { rating } = req.body;
    if (rating !== null && !(Number.isInteger(rating) && rating >= 1 && rating <= 5)) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }
    updates.rating = rating;
  }

  if ("review" in req.body) {
    const { review } = req.body;
    if (review !== null && typeof review !== "string") {
      return res.status(400).json({ message: "Review must be text" });
    }
    if (review && review.length > MAX_REVIEW_LENGTH) {
      return res.status(400).json({ message: `Review must be under ${MAX_REVIEW_LENGTH} characters` });
    }
    updates.review = review?.trim() || null; // store empty reviews as NULL
  }

  const columns = Object.keys(updates);
  if (columns.length === 0) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  try {
    const current = await getUserBook(user_id, bookId);
    if (!current) {
      return res.status(404).json({ message: "Book not found on your list" });
    }

    // Column names come only from the fixed set above, never from user input,
    // so it's safe to build the SET clause from them. Values stay parameterized.
    const assignments = columns.map((column) => `${column} = ?`);

    // Keep finished_at in step with the shelf: stamp it when a book moves to
    // "read", clear it when it moves off. Re-saving "read" keeps the original date.
    if (updates.status === "read" && current.status !== "read") {
      assignments.push("finished_at = CURRENT_TIMESTAMP");
    } else if (updates.status && updates.status !== "read") {
      assignments.push("finished_at = NULL");
    }

    await db.execute(
      `UPDATE user_books SET ${assignments.join(", ")} WHERE user_id = ? AND book_id = ?`,
      [...Object.values(updates), user_id, bookId]
    );

    res.json(await getUserBook(user_id, bookId));
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Failed to update book" });
  }
});

// Remove a book from the user's list
router.delete("/user-books/:bookId", async (req, res) => {
  const user_id = req.user.userId;

  try {
    const [result] = await db.execute(
      "DELETE FROM user_books WHERE user_id = ? AND book_id = ?",
      [user_id, req.params.bookId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found on your list" });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Error removing book:", error);
    res.status(500).json({ message: "Failed to remove book" });
  }
});

const MAX_GOAL = 1000;

// Reading stats for the profile Stats tab.
// Year-scoped figures (monthly counts, goal) use the current year; the shelf,
// rating and author figures cover all time.
router.get("/stats", async (req, res) => {
  const user_id = req.user.userId;
  const year = new Date().getFullYear();

  try {
    const [[shelfRows], [monthRows], [ratingRows], [authorRows], [goalRows]] = await Promise.all([
      db.execute(
        "SELECT status, COUNT(*) AS count FROM user_books WHERE user_id = ? GROUP BY status",
        [user_id]
      ),
      db.execute(
        `SELECT MONTH(finished_at) AS month, COUNT(*) AS count
           FROM user_books
          WHERE user_id = ? AND status = 'read' AND YEAR(finished_at) = ?
          GROUP BY month`,
        [user_id, year]
      ),
      db.execute(
        `SELECT rating, COUNT(*) AS count FROM user_books
          WHERE user_id = ? AND rating IS NOT NULL GROUP BY rating`,
        [user_id]
      ),
      db.execute(
        `SELECT author, COUNT(*) AS count FROM user_books
          WHERE user_id = ? AND status = 'read' AND author IS NOT NULL AND author <> 'Unknown'
          GROUP BY author ORDER BY count DESC, author ASC LIMIT 5`,
        [user_id]
      ),
      db.execute("SELECT target FROM reading_goals WHERE user_id = ? AND year = ?", [user_id, year]),
    ]);

    const shelves = { want_to_read: 0, reading: 0, read: 0 };
    for (const row of shelfRows) shelves[row.status] = row.count;

    // Index 0 = January; months with no finished books stay 0
    const monthly = Array(12).fill(0);
    for (const row of monthRows) monthly[row.month - 1] = row.count;

    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingTotal = 0;
    let ratedCount = 0;
    for (const row of ratingRows) {
      ratings[row.rating] = row.count;
      ratingTotal += row.rating * row.count;
      ratedCount += row.count;
    }

    res.json({
      year,
      shelves,
      readThisYear: monthly.reduce((sum, n) => sum + n, 0),
      monthly,
      ratings,
      ratedCount,
      averageRating: ratedCount ? Math.round((ratingTotal / ratedCount) * 10) / 10 : null,
      topAuthors: authorRows,
      goal: goalRows[0]?.target ?? null,
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ message: "Failed to load reading stats" });
  }
});

// Set this year's reading goal: { target: 1-1000 }, or { target: null } to remove it
router.put("/goal", async (req, res) => {
  const user_id = req.user.userId;
  const year = new Date().getFullYear();
  const { target } = req.body;

  if (target !== null && !(Number.isInteger(target) && target >= 1 && target <= MAX_GOAL)) {
    return res.status(400).json({ message: `Goal must be a whole number from 1 to ${MAX_GOAL}` });
  }

  try {
    if (target === null) {
      await db.execute("DELETE FROM reading_goals WHERE user_id = ? AND year = ?", [user_id, year]);
    } else {
      await db.execute(
        `INSERT INTO reading_goals (user_id, year, target) VALUES (?, ?, ?) AS new_goal
         ON DUPLICATE KEY UPDATE target = new_goal.target`,
        [user_id, year, target]
      );
    }
    res.json({ year, goal: target });
  } catch (error) {
    console.error("Error saving goal:", error);
    res.status(500).json({ message: "Failed to save reading goal" });
  }
});

// Route to get AI book recommendations based on the user's history.
// Returns { recommendations: [{ id, title, author, coverImage, description, link, reason }] }.
// Results are cached per user; pass ?refresh=true to generate a new set.
router.get("/recommendations", async (req, res) => {
  const user_id = req.user.userId;
  const refresh = req.query.refresh === "true";

  try {
    const [rows] = await db.execute(
      "SELECT book_id, title, author, status, rating FROM user_books WHERE user_id = ?",
      [user_id]
    );

    if (rows.length === 0) {
      return res.json({ recommendations: [] });
    }

    const recommendations = await getRecommendations(user_id, rows, { refresh });
    res.json({ recommendations });
  } catch (error) {
    console.error("Error getting recommendations:", error?.response?.data || error);

    // OpenAI also uses 429 for an exhausted account balance, which retrying
    // won't fix, so report that as the service being unavailable instead
    if (error.response?.data?.error?.type === "insufficient_quota") {
      return res
        .status(503)
        .json({ message: "Recommendations are temporarily unavailable." });
    }

    if (error.response && error.response.status === 429) {
      return res
        .status(429)
        .json({ message: "Rate limited by OpenAI. Please try again later." });
    }

    res.status(500).json({ message: "Failed to get recommendations" });
  }
});




module.exports = router;
