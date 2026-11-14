const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const pool = require("../../database/db");
const { authenticateToken } = require("../../middleware/authMiddleware");
const { validateEmail, validateUsername, MIN_PASSWORD_LENGTH } = require("../../utils/validation");
const multer = require("multer");
const { processAvatar, avatarUrl, MAX_UPLOAD_BYTES, ACCEPTED_TYPES } = require("../../utils/avatars");

// Uploads are held in memory (they're capped at 5 MB) and only the resized
// version is stored. The type check here is a fast first filter; processAvatar
// is what actually verifies the file is an image.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => cb(null, ACCEPTED_TYPES.includes(file.mimetype)),
});

// Only lets users change their own account
const requireSelf = (req, res, next) =>
  req.user.userId === parseInt(req.params.id, 10)
    ? next()
    : res.status(403).json({ message: "Forbidden" });

// Runs multer and turns its errors (e.g. file too large) into 400 responses
function acceptAvatarUpload(req, res, next) {
  upload.single("avatar")(req, res, (err) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Pictures must be 5 MB or smaller" });
    }
    if (err) return res.status(400).json({ message: "Upload failed" });
    next();
  });
}

// Update the logged-in user's username, email and (optionally) password.
// Body: { username, email, password?, oldPassword? }. A new password requires oldPassword.
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, password, oldPassword } = req.body;

  if (req.user.userId !== parseInt(id, 10)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Same rules as sign-up
  if (!validateUsername(username)) {
    return res.status(400).json({
      message: "Username must be 3-30 characters and contain only letters, numbers, and underscores",
    });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }
  if (password !== undefined && (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH)) {
    return res
      .status(400)
      .json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
  }

  try {
    const updatedUser = await User.update(id, { username, email, password, oldPassword });
    res.json({ user: updatedUser });
  } catch (err) {
    if (err.message === "Current password is incorrect") {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "That username or email is already taken" });
    }
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Error updating user" });
  }
});

// Make the logged-in user's profile private or public: { isPrivate: boolean }
router.put("/:id/privacy", authenticateToken, async (req, res) => {
  if (req.user.userId !== parseInt(req.params.id, 10)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { isPrivate } = req.body;
  if (typeof isPrivate !== "boolean") {
    return res.status(400).json({ message: "isPrivate must be true or false" });
  }

  try {
    await pool.execute("UPDATE users SET is_private = ? WHERE id = ?", [isPrivate, req.user.userId]);
    res.json({ isPrivate });
  } catch (err) {
    console.error("Error updating privacy:", err);
    res.status(500).json({ message: "Failed to update privacy setting" });
  }
});

// Upload a profile picture: multipart/form-data with an "avatar" file field
// (JPEG, PNG, WebP or GIF, up to 5 MB). Returns { avatarUrl }.
router.put("/:id/avatar", authenticateToken, requireSelf, acceptAvatarUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Choose a JPEG, PNG, WebP or GIF image" });
  }

  let image;
  try {
    image = await processAvatar(req.file.buffer);
  } catch {
    return res.status(400).json({ message: "That file couldn't be read as an image" });
  }

  try {
    await pool.execute(
      "UPDATE users SET avatar = ?, avatar_updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [image, req.user.userId]
    );
    const [[row]] = await pool.execute("SELECT username, avatar_updated_at FROM users WHERE id = ?", [
      req.user.userId,
    ]);
    res.json({ avatarUrl: avatarUrl(row.username, row.avatar_updated_at) });
  } catch (err) {
    console.error("Error saving avatar:", err);
    res.status(500).json({ message: "Failed to save your picture" });
  }
});

// Remove the profile picture
router.delete("/:id/avatar", authenticateToken, requireSelf, async (req, res) => {
  try {
    await pool.execute("UPDATE users SET avatar = NULL, avatar_updated_at = NULL WHERE id = ?", [
      req.user.userId,
    ]);
    res.json({ avatarUrl: null });
  } catch (err) {
    console.error("Error removing avatar:", err);
    res.status(500).json({ message: "Failed to remove your picture" });
  }
});

module.exports = router;
