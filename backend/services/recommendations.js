// AI-powered book recommendations.
//
// Pipeline:
//   1. Ask OpenAI for recommendations using Structured Outputs (a JSON schema),
//      so the response is guaranteed to parse into {title, author, reason}.
//   2. Look each suggestion up on Google Books. Suggestions that can't be found
//      are dropped, which filters out hallucinated books, and the rest get real
//      IDs, covers, descriptions and links the UI can render.
//   3. Cache the result per user, keyed on their current shelves and ratings,
//      so repeat visits don't cost an OpenAI call and any change invalidates it.

const axios = require("axios");
const { searchVolumes, toBook } = require("../utils/googleBooks");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

// Ask for a few extra, since some may be dropped during Google Books lookup
const NUM_TO_REQUEST = 7;
const NUM_TO_RETURN = 5;

// Schema the model's response must follow (OpenAI Structured Outputs)
const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "book_recommendations",
    strict: true,
    schema: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              author: { type: "string" },
              reason: {
                type: "string",
                description:
                  "One sentence explaining why this reader would enjoy it, referencing books from their list",
              },
            },
            required: ["title", "author", "reason"],
            additionalProperties: false,
          },
        },
      },
      required: ["recommendations"],
      additionalProperties: false,
    },
  },
};

// In-memory cache: userId -> { key, recommendations }.
// `key` is the user's sorted book IDs, so the entry goes stale as soon as their
// history changes. This resets on server restart and isn't shared between
// instances; swap it for Redis if the backend is ever scaled horizontally.
const cache = new Map();

const STATUS_LABELS = {
  read: "read",
  reading: "currently reading",
  want_to_read: "want to read",
};

// Formats one saved book for the prompt, e.g.
// "- Dune by Frank Herbert [read, rated 5/5]"
function describeBook(book) {
  const tags = [STATUS_LABELS[book.status] || "read"];
  if (book.rating) tags.push(`rated ${book.rating}/5`);
  const byline = book.author ? ` by ${book.author}` : "";
  return `- ${book.title}${byline} [${tags.join(", ")}]`;
}

// Asks the model for suggestions based on the user's books.
async function getAiSuggestions(books) {
  const bookList = books.map(describeBook).join("\n");

  const response = await axios.post(
    OPENAI_URL,
    {
      model: MODEL,
      temperature: 0.7,
      response_format: RESPONSE_FORMAT,
      messages: [
        {
          role: "system",
          content:
            "You are a knowledgeable librarian giving personalized book recommendations. " +
            "Only recommend real, published books. Never recommend a book the reader has already read.",
        },
        {
          role: "user",
          content:
            `Here are the books on my shelves:\n${bookList}\n\n` +
            `Ratings show how much I liked a book, so lean toward what I rated highly ` +
            `and away from what I rated low. "Want to read" books show my interests, ` +
            `but I haven't read them yet.\n\n` +
            `Recommend ${NUM_TO_REQUEST} books that are not on my shelves. For each one, ` +
            `give a one-sentence reason that connects it to specific books on my list.`,
        },
      ],
    },
    { headers: { Authorization: `Bearer ${process.env.OPEN_AI_KEY}` } }
  );

  const message = response.data.choices[0].message;
  if (message.refusal) return [];

  try {
    return JSON.parse(message.content).recommendations;
  } catch {
    // Only possible if the output was cut off (e.g. hit the token limit)
    console.error("Could not parse recommendations:", message.content);
    return [];
  }
}

// Lowercase and strip punctuation/spaces so "Mistborn: The Final Empire"
// and "mistborn the final empire" compare equal.
const normalize = (text) => (text || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Google's top search hit is often a different book by the same author (e.g.
// "Mistborn" can return a later book in the series or a box set), so pick the
// candidate whose title actually matches: an exact match first, then a prefix
// match. Subtitles are included because Google often splits them out
// ("Mistborn" + "The Final Empire").
function pickMatchingVolume(requested, items) {
  const wanted = normalize(requested);
  const titles = items.map((item) => ({
    item,
    title: normalize(item.volumeInfo.title),
    fullTitle: normalize(`${item.volumeInfo.title} ${item.volumeInfo.subtitle || ""}`),
  }));

  const exact = titles.find((t) => t.title === wanted || t.fullTitle === wanted);
  if (exact) return exact.item;

  const prefix = titles.find(
    (t) => t.fullTitle.startsWith(wanted) || (t.title && wanted.startsWith(t.title))
  );
  return prefix ? prefix.item : null;
}

// Finds the Google Books volume for a suggestion, or null if none matches.
async function findOnGoogleBooks({ title, author }) {
  try {
    const volumes = await searchVolumes(`intitle:${title} inauthor:${author}`, {
      maxResults: 5,
    });

    const item = pickMatchingVolume(title, volumes);
    if (!item) return null;

    // Keep the AI's author if Google has none listed
    const book = toBook(item);
    return { ...book, author: item.volumeInfo.authors?.[0] || author };
  } catch (error) {
    console.error(`Google Books lookup failed for "${title}":`, error.message);
    return null;
  }
}

// Returns up to NUM_TO_RETURN recommendations for a user.
// `books` are the user's rows from user_books ({ book_id, title, author, status, rating }).
// Pass { refresh: true } to skip the cache and get a fresh set.
async function getRecommendations(userId, books, { refresh = false } = {}) {
  // Shelf and rating are part of the key, since changing them changes the prompt
  const cacheKey = books
    .map((b) => `${b.book_id}:${b.status}:${b.rating ?? ""}`)
    .sort()
    .join(",");
  const cached = cache.get(userId);
  if (!refresh && cached && cached.key === cacheKey) {
    return cached.recommendations;
  }

  const suggestions = await getAiSuggestions(books);

  // Look up all suggestions in parallel
  const matches = await Promise.all(
    suggestions.map(async (suggestion) => {
      const book = await findOnGoogleBooks(suggestion);
      return book && { ...book, reason: suggestion.reason };
    })
  );

  // Drop books that weren't found, are already on the user's list, or are
  // duplicates of each other. Titles are checked as well as IDs because Google
  // Books has a separate ID for every edition of the same book.
  const seenIds = new Set(books.map((b) => b.book_id));
  const seenTitles = new Set(books.map((b) => normalize(b.title)));
  const recommendations = [];
  for (const book of matches) {
    if (!book || seenIds.has(book.id) || seenTitles.has(normalize(book.title))) continue;
    seenIds.add(book.id);
    seenTitles.add(normalize(book.title));
    recommendations.push(book);
    if (recommendations.length === NUM_TO_RETURN) break;
  }

  if (recommendations.length > 0) {
    cache.set(userId, { key: cacheKey, recommendations });
  }
  return recommendations;
}

module.exports = { getRecommendations };
