// Entry point for express app


const express = require("express");
const cors = require("cors");
const pool = require("./database/db");
require("dotenv").config();

const bookRoutes = require("./routes/loadbooks")


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

app.use("/api/books", bookRoutes);


// Basic check
app.get("/", (req, res) => {
    res.send("Backend is running");
});


// Test DB connection
app.get("/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users"); // Change this line
        res.send(`DB is working! Users: ${JSON.stringify(rows)}`); // Update response
    } catch (err) {
        console.error("DB connection failed:", err);
        res.status(500).send("Database connection error");
    }
});



// Starts the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
