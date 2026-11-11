// Shared Google Books API helpers, so every route requests and shapes book
// data the same way.

const axios = require("axios");

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";

// Converts a Google Books volume into the book shape the frontend uses
function toBook(item) {
  const info = item.volumeInfo || {};
  return {
    id: item.id,
    title: info.title,
    author: info.authors ? info.authors[0] : "Unknown",
    coverImage: info.imageLinks?.thumbnail || null,
    description: info.description || "",
    link: info.infoLink || "",
  };
}

// Runs a Google Books search and returns the raw volumes.
// Google omits `items` entirely when nothing matches, so this always returns an array.
async function searchVolumes(query, { maxResults = 20, orderBy } = {}) {
  const response = await axios.get(GOOGLE_BOOKS_URL, {
    params: {
      q: query,
      maxResults,
      orderBy, // axios leaves this out of the URL when undefined
      key: process.env.GOOGLE_BOOKS_API_KEY,
    },
  });
  return response.data.items || [];
}

// Runs a Google Books search and returns books in the frontend's shape
async function searchBooks(query, options) {
  const volumes = await searchVolumes(query, options);
  return volumes.map(toBook);
}

module.exports = { toBook, searchVolumes, searchBooks };
