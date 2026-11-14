// Account field rules, shared by sign-up and profile updates

const MIN_PASSWORD_LENGTH = 6;

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Letters, numbers and underscores only, so usernames are safe to use in
// profile URLs (/readers/:username)
const validateUsername = (username) =>
  typeof username === "string" && /^[a-zA-Z0-9_]{3,30}$/.test(username);

module.exports = { validateEmail, validateUsername, MIN_PASSWORD_LENGTH };
