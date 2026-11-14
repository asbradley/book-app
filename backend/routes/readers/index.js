// Public reader profiles and following.
//
//   GET    /api/readers/search?q=        find readers by username
//   GET    /api/readers/:username        profile, counts and (if visible) books
//   GET    /api/readers/:username/followers | /following
//   POST   /api/readers/:username/follow   (login required)
//   DELETE /api/readers/:username/follow   (login required)
//
// Private profiles show only their username, join date and follower counts to
// other users; their books, reviews and follow lists are visible only to them.

const express = require("express");
const db = require("../../database/db");
const { authenticateToken, optionalAuth } = require("../../middleware/authMiddleware");
const { searchLimiter } = require("../../middleware/rateLimits");

const router = express.Router();

const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 30;
const SEARCH_LIMIT = 10;
const FOLLOW_LIST_LIMIT = 100;

async function findReader(username) {
  const [rows] = await db.execute(
    "SELECT id, username, is_private, created_at FROM users WHERE username = ?",
    [username]
  );
  return rows[0];
}

const canView = (reader, viewer) => !reader.is_private || viewer?.userId === reader.id;

async function followCounts(userId) {
  const [[row]] = await db.execute(
    `SELECT
       (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followers,
       (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS following`,
    [userId, userId]
  );
  return row;
}

// Escapes LIKE wildcards so a search for "a_b" matches literally
const escapeLike = (text) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

router.get("/search", searchLimiter, async (req, res) => {
  const query = (req.query.q || "").trim();
  if (query.length < MIN_SEARCH_LENGTH || query.length > MAX_SEARCH_LENGTH) {
    return res.status(400).json({
      message: `Search must be between ${MIN_SEARCH_LENGTH} and ${MAX_SEARCH_LENGTH} characters`,
    });
  }

  try {
    // Usernames that start with the query rank above ones that only contain it
    const [rows] = await db.execute(
      `SELECT username FROM users
        WHERE username LIKE ?
        ORDER BY username LIKE ? DESC, username ASC
        LIMIT ${SEARCH_LIMIT}`,
      [`%${escapeLike(query)}%`, `${escapeLike(query)}%`]
    );
    res.json(rows.map((row) => row.username));
  } catch (error) {
    console.error("Error searching readers:", error);
    res.status(500).json({ message: "Failed to search readers" });
  }
});

router.get("/:username", optionalAuth, async (req, res) => {
  try {
    const reader = await findReader(req.params.username);
    if (!reader) return res.status(404).json({ message: "Reader not found" });

    const viewerId = req.user?.userId;
    const visible = canView(reader, req.user);

    const [counts, followRows, books] = await Promise.all([
      followCounts(reader.id),
      viewerId
        ? db.execute("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?", [viewerId, reader.id])
        : [[]],
      visible
        ? db.execute(
            `SELECT book_id, title, author, cover_image, status, rating, review, finished_at, updated_at
               FROM user_books WHERE user_id = ? ORDER BY updated_at DESC`,
            [reader.id]
          )
        : [null],
    ]);

    res.json({
      username: reader.username,
      joinedAt: reader.created_at,
      isPrivate: Boolean(reader.is_private),
      isSelf: viewerId === reader.id,
      isFollowing: followRows[0].length > 0,
      followerCount: counts.followers,
      followingCount: counts.following,
      books: books[0], // null when the profile is private
    });
  } catch (error) {
    console.error("Error loading reader:", error);
    res.status(500).json({ message: "Failed to load reader" });
  }
});

// Follower / following lists, newest first
const followList = (direction) => async (req, res) => {
  // followers: people whose following_id is this reader; following: the reverse
  const [matchColumn, otherColumn] =
    direction === "followers" ? ["following_id", "follower_id"] : ["follower_id", "following_id"];

  try {
    const reader = await findReader(req.params.username);
    if (!reader) return res.status(404).json({ message: "Reader not found" });
    if (!canView(reader, req.user)) {
      return res.status(403).json({ message: "This profile is private" });
    }

    const [rows] = await db.execute(
      `SELECT u.username FROM follows f
         JOIN users u ON u.id = f.${otherColumn}
        WHERE f.${matchColumn} = ?
        ORDER BY f.created_at DESC
        LIMIT ${FOLLOW_LIST_LIMIT}`,
      [reader.id]
    );
    res.json(rows.map((row) => row.username));
  } catch (error) {
    console.error(`Error loading ${direction}:`, error);
    res.status(500).json({ message: `Failed to load ${direction}` });
  }
};

router.get("/:username/followers", optionalAuth, followList("followers"));
router.get("/:username/following", optionalAuth, followList("following"));

// Follow and unfollow are idempotent; both return the new follower count
router.post("/:username/follow", authenticateToken, async (req, res) => {
  try {
    const reader = await findReader(req.params.username);
    if (!reader) return res.status(404).json({ message: "Reader not found" });
    if (reader.id === req.user.userId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    await db.execute("INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)", [
      req.user.userId,
      reader.id,
    ]);
    const { followers } = await followCounts(reader.id);
    res.json({ isFollowing: true, followerCount: followers });
  } catch (error) {
    console.error("Error following reader:", error);
    res.status(500).json({ message: "Failed to follow reader" });
  }
});

router.delete("/:username/follow", authenticateToken, async (req, res) => {
  try {
    const reader = await findReader(req.params.username);
    if (!reader) return res.status(404).json({ message: "Reader not found" });

    await db.execute("DELETE FROM follows WHERE follower_id = ? AND following_id = ?", [
      req.user.userId,
      reader.id,
    ]);
    const { followers } = await followCounts(reader.id);
    res.json({ isFollowing: false, followerCount: followers });
  } catch (error) {
    console.error("Error unfollowing reader:", error);
    res.status(500).json({ message: "Failed to unfollow reader" });
  }
});

module.exports = router;
