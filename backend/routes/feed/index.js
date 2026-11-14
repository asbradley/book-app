// Activity from the readers you follow: GET /api/feed (login required).
//
// The feed is built from user_books rather than a separate event log: each
// book on a followed reader's shelves is one item, timestamped by its last
// change (added, moved shelf, rated or reviewed) and showing its current
// state. That needs no extra writes or storage, at the cost of not keeping
// history (moving a book Reading -> Read replaces the "started" item with a
// "finished" one). Private readers are left out.
//
// Paginated newest first, 20 at a time. Pass the response's `nextCursor` as
// ?cursor= to get the next page; it's null on the last page.

const express = require("express");
const db = require("../../database/db");
const { authenticateToken } = require("../../middleware/authMiddleware");
const { avatarUrl } = require("../../utils/avatars");

const router = express.Router();
const PAGE_SIZE = 20;

// The cursor is "<ms timestamp>_<row id>" of the last item on the page. The id
// breaks ties between items changed in the same second.
const encodeCursor = (item) => `${new Date(item.activity_at).getTime()}_${item.id}`;

function decodeCursor(cursor) {
  const match = /^(\d+)_(\d+)$/.exec(cursor || "");
  return match ? { time: new Date(Number(match[1])), id: Number(match[2]) } : null;
}

router.get("/", authenticateToken, async (req, res) => {
  const cursor = decodeCursor(req.query.cursor);
  if (req.query.cursor && !cursor) {
    return res.status(400).json({ message: "Invalid cursor" });
  }

  try {
    const params = [req.user.userId];
    let cursorClause = "";
    if (cursor) {
      cursorClause = "AND (ub.updated_at < ? OR (ub.updated_at = ? AND ub.id < ?))";
      params.push(cursor.time, cursor.time, cursor.id);
    }

    // One extra row tells us whether there's another page
    const [rows] = await db.execute(
      `SELECT ub.id, u.username, u.avatar_updated_at, ub.book_id, ub.title, ub.author, ub.cover_image,
              ub.status, ub.rating, ub.review, ub.updated_at AS activity_at
         FROM follows f
         JOIN users u ON u.id = f.following_id AND u.is_private = FALSE
         JOIN user_books ub ON ub.user_id = f.following_id
        WHERE f.follower_id = ? ${cursorClause}
        ORDER BY ub.updated_at DESC, ub.id DESC
        LIMIT ${PAGE_SIZE + 1}`,
      params
    );

    const hasMore = rows.length > PAGE_SIZE;
    const items = rows.slice(0, PAGE_SIZE);
    res.json({
      items: items.map(({ id, avatar_updated_at, ...item }) => ({
        ...item,
        avatarUrl: avatarUrl(item.username, avatar_updated_at),
      })),
      nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null,
    });
  } catch (error) {
    console.error("Error loading feed:", error);
    res.status(500).json({ message: "Failed to load your feed" });
  }
});

module.exports = router;
