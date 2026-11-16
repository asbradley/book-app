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

// Returns the cached promise for `key`, or calls `load()` and caches its promise
function cached(key, load) {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.promise;
  }

  const promise = load();
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

// Runs a Google Books search and returns the raw volumes.
// Google omits `items` entirely when nothing matches, so this always returns an array.
function searchVolumes(query, { maxResults = 20, orderBy } = {}) {
  return cached(JSON.stringify(["search", query, maxResults, orderBy]), () =>
    axios
      .get(GOOGLE_BOOKS_URL, {
        params: {
          q: query,
          maxResults,
          orderBy, // axios leaves this out of the URL when undefined
          key: process.env.GOOGLE_BOOKS_API_KEY,
        },
      })
      .then((response) => response.data.items || [])
  );
}

// Runs a Google Books search and returns books in the frontend's shape
async function searchBooks(query, options) {
  const volumes = await searchVolumes(query, options);
  return volumes.map(toBook);
}

// A single volume's description is HTML (<p>, <br>, <b>...), unlike search
// results. The frontend shows it as plain text, so keep the paragraph breaks
// and drop the rest of the markup.
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };
function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name) => ENTITIES[name])
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Google Books volume IDs are 12 letters, digits, - or _ (e.g. "ryot4Ag2GGQC").
// Checking first saves a call, and Google answers malformed IDs with a 503
// rather than a 404, which would otherwise look like an outage.
const VOLUME_ID_PATTERN = /^[A-Za-z0-9_-]{12}$/;

// Fetches one book by its volume ID, with a few more details than search
// results carry. Resolves to null when Google has no such volume.
function getBook(id) {
  if (!VOLUME_ID_PATTERN.test(id)) return Promise.resolve(null);

  return cached(JSON.stringify(["volume", id]), () =>
    axios
      .get(`${GOOGLE_BOOKS_URL}/${id}`, { params: { key: process.env.GOOGLE_BOOKS_API_KEY } })
      .then((response) => {
        const info = response.data.volumeInfo || {};
        return {
          ...toBook(response.data),
          description: htmlToText(info.description || ""),
          authors: info.authors || [],
          publishedDate: info.publishedDate || null,
          pageCount: info.pageCount || null,
          categories: info.categories || [],
        };
      })
      // A well-formed ID that doesn't exist gets a 404, cached here as null;
      // other errors aren't cached, so they're retried next time
      .catch((error) => {
        if (error.response?.status === 404) return null;
        throw error;
      })
  );
}

module.exports = { toBook, searchVolumes, searchBooks, getBook, clearCache };
