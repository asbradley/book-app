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
const { searchLimiter } = require("./middleware/rateLimits");

const app = express();

// Behind a reverse proxy or load balancer (most hosting platforms), every
// request appears to come from the proxy, so per-IP rate limits would be shared
// by all users. TRUST_PROXY tells Express how many proxy hops to trust when
// reading the client IP from X-Forwarded-For (e.g. TRUST_PROXY=1). Leave it
// unset when the server is reached directly, or clients could spoof their IP.
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set("trust proxy", Number.isNaN(hops) ? process.env.TRUST_PROXY : hops);
}

// Only allow the frontend's origin. Auth uses a Bearer token header (not
// cookies), so credentials mode isn't needed. In local dev the CRA proxy makes
// requests same-origin, so this mostly matters once the app is deployed.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  })
);

app.use(express.json());

app.use("/api/books", searchLimiter, bookRoutes);
app.use("/api/genre", searchLimiter, genreBookRoutes);
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
