const express = require("express");
const router = express.Router();
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../database/db");
const { authenticateToken } = require("../../middleware/authMiddleware"); // Import middleware

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username) && username.length >= 3;
};

// Register route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation that all fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required",
      });
    }

    // Validating username
    if (!validateUsername(username)) {
      return res.status(400).json({
        message:
          "Username must be at least 3 characters long and contain only letters, numbers, and underscores",
      });
    }

    // Validating email
    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    // Validating password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists (by email or username)
    const connection = await pool.getConnection();
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({
        message: "User with this email or username already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await connection.execute(
      "INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())",
      [username, email, hashedPassword]
    );

    connection.release();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: result.insertId,
        username: username,
        email: email,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: result.insertId,
        username: username,
        email: email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Login route - expects email and password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      "SELECT id, username, email, password FROM users WHERE email = ?",
      [email]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});



// Protected route example - requires authentication
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      "SELECT id, email, created_at FROM users WHERE id = ?",
      [req.user.userId]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Verify token route - useful for checking if user is still logged in
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    message: "Token is valid",
    user: {
      userId: req.user.userId,
      email: req.user.email,
    },
  });
});

module.exports = router;
