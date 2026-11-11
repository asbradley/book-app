// Express app: middleware and routes. Started by index.js; imported directly by tests.

const express = require("express");
const cors = require("cors");
const pool = require("./database/db");
require("dotenv").config();

const bookRoutes = require("./routes/loadbooks");
const genreBookRoutes = require("./routes/genreBooks");
const authRoutes = require("./routes/auth")
const historyRoute = require("./routes/history");
const userRoutes = require("./routes/account");

const app = express();

// Only allow the frontend's origin. Auth uses a Bearer token header (not
// cookies), so credentials mode isn't needed. In local dev the CRA proxy makes
// requests same-origin, so this mostly matters once the app is deployed.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  })
);

app.use(express.json());

app.use("/api/books", bookRoutes);
app.use("/api/genre", genreBookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/history", historyRoute);


// Basic check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Health check: confirms the server can reach the database without exposing data
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

module.exports = app;
