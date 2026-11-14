const mysql = require('mysql2/promise')
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Timestamps are exchanged in UTC (see below), so tell mysql2 to read and
    // write JS Dates as UTC too
    timezone: 'Z',
});

// Use UTC for every connection. TIMESTAMP columns are stored in UTC but read
// back in the session's time zone, and mysql2 can't know which zone that is.
// Without this, a database server in a different zone from the Node server
// (common once hosted) shifts every date by the difference between them.
pool.pool.on('connection', (connection) => {
    connection.query("SET time_zone = '+00:00'");
});

module.exports = pool;

