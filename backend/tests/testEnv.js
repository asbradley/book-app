// Environment for the test suite. Applied before any app code loads.
//
// Every DB_* variable is set explicitly, so dotenv (which never overrides
// variables that already exist) can't fall back to the real database in .env.
// Defaults match the local Docker container (see "test:db" in package.json)
// and can be overridden by real environment variables, which is how CI
// points the tests at its MySQL service.

const testEnv = {
  DB_HOST: process.env.TEST_DB_HOST || "127.0.0.1",
  DB_PORT: process.env.TEST_DB_PORT || "3307",
  DB_USER: process.env.TEST_DB_USER || "root",
  DB_PASSWORD: process.env.TEST_DB_PASSWORD || "test",
  DB_NAME: process.env.TEST_DB_NAME || "book_project_test",
  JWT_SECRET_KEY: "test-jwt-secret",
  OPEN_AI_KEY: "test-openai-key",
  GOOGLE_BOOKS_API_KEY: "test-google-key",
};

function applyTestEnv() {
  // Safety net: refuse to run against anything that isn't a test database,
  // because the tests delete all rows between cases.
  if (!testEnv.DB_NAME.endsWith("_test")) {
    throw new Error(`Refusing to run tests against non-test database "${testEnv.DB_NAME}"`);
  }
  Object.assign(process.env, testEnv);
}

module.exports = { applyTestEnv };
