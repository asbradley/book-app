// Shared helpers for API tests
const request = require("supertest");
const app = require("../app");
const db = require("../database/db");

// Removes all rows so each test starts from an empty database
async function resetDb() {
  await db.query("DELETE FROM reading_goals");
  await db.query("DELETE FROM user_books");
  await db.query("DELETE FROM users");
}

// Registers a user through the real endpoint and returns { token, user }
let userCounter = 0;
async function createUser(overrides = {}) {
  userCounter += 1;
  const body = {
    username: `reader${userCounter}`,
    email: `reader${userCounter}@example.com`,
    password: "password123",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(body);
  if (res.status !== 201) {
    throw new Error(`createUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, user: res.body.user, password: body.password };
}

// Adds a book to a user's shelves through the real endpoint
function addBook(token, book = {}) {
  return request(app)
    .post("/api/history/user-books")
    .set("Authorization", `Bearer ${token}`)
    .send({ book_id: "vol1", title: "Dune", author: "Frank Herbert", ...book });
}

module.exports = { app, db, request, resetDb, createUser, addBook };
