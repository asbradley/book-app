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

// Short-lived in-memory cache of search results. The home page, genre pages
// and popular searches repeat the same queries constantly, so this saves
// Google Books quota and makes repeat loads instant. It stores the pending
// promise, so identical requests that arrive together share one API call;
// failed requests are dropped so they can be retried.
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const cache = new Map(); // key -> { expiresAt, promise }

function clearCache() {
  cache.clear();
}

// Runs a Google Books search and returns the raw volumes.
// Google omits `items` entirely when nothing matches, so this always returns an array.
function searchVolumes(query, { maxResults = 20, orderBy } = {}) {
  const key = JSON.stringify([query, maxResults, orderBy]);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = axios
    .get(GOOGLE_BOOKS_URL, {
      params: {
        q: query,
        maxResults,
        orderBy, // axios leaves this out of the URL when undefined
        key: process.env.GOOGLE_BOOKS_API_KEY,
      },
    })
    .then((response) => response.data.items || []);

  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });

  // Map keeps insertion order, so the first key is the oldest entry
  cache.delete(key);
  if (cache.size >= CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, promise });

  return promise;
}

// Runs a Google Books search and returns books in the frontend's shape
async function searchBooks(query, options) {
  const volumes = await searchVolumes(query, options);
  return volumes.map(toBook);
}

module.exports = { toBook, searchVolumes, searchBooks, clearCache };
