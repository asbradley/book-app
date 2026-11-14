const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// For routes that work logged out but show more when logged in: sets req.user
// when a valid token is sent, and otherwise carries on as an anonymous visitor
// (an expired or invalid token is treated the same as no token).
const optionalAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (!err) req.user = user;
    next();
  });
};

module.exports = { authenticateToken, optionalAuth };
