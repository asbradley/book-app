// Runs once before the whole suite: creates the tables from schema.sql, so the
// test database always matches the schema a fresh install would get.
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { applyTestEnv } = require("./testEnv");

module.exports = async () => {
  applyTestEnv();
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });
  const schema = fs.readFileSync(path.join(__dirname, "../database/schema.sql"), "utf8");
  await connection.query(schema);
  await connection.end();
};
