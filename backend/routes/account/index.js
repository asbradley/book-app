const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const { authenticateToken } = require("../../middleware/authMiddleware"); // Import middleware

// Update user profile
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, password, oldPassword } = req.body;

  if (req.user.userId !== parseInt(id, 10)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const updatedUser = await User.update(id, { username, email, password, oldPassword });
    res.json({ user: updatedUser });
  } catch (err) {
    if (err.message === 'Current password is incorrect') {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
});
  
module.exports = router;