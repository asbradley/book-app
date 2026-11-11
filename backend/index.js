// Entry point: starts the HTTP server.
// The Express app itself lives in app.js so tests can import it without
// opening a port.

require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
