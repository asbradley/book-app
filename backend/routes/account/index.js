const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const pool = require("../../database/db");
const { authenticateToken } = require("../../middleware/authMiddleware");
const { validateEmail, validateUsername, MIN_PASSWORD_LENGTH } = require("../../utils/validation");

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

module.exports = router;
