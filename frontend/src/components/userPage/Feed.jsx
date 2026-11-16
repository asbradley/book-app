import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import StarRating from "./StarRating";
import BookCover from "../readers/BookCover";
import ReaderSearch from "../readers/ReaderSearch";
import Avatar from "../common/Avatar";
import { timeAgo } from "../../utils/time";

// What a feed item says the reader did, from the book's current shelf
const ACTIONS = {
  want_to_read: "wants to read",
  reading: "is reading",
  read: "finished",
};

// Activity from the readers you follow, newest first, with "Load more" paging
export default function Feed() {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (cursor) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/feed", { params: cursor ? { cursor } : {} });
      setItems((prev) => (cursor ? [...prev, ...response.data.items] : response.data.items));
      setNextCursor(response.data.nextCursor);
    } catch (err) {
      console.error("Error loading feed:", err);
      setError("Failed to load your feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(null);
  }, [loadPage]);

  return (
    <div className="space-y-6">
      <ReaderSearch />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-gray-500">
          Nothing here yet. Find readers above and follow them to see what they're reading.
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={`${item.username}:${item.book_id}`}
            className="flex gap-3 p-3 rounded-xl border border-gray-200"
          >
            <BookCover src={item.cover_image} title={item.title} />
            <div className="min-w-0 text-sm">
              <p>
                <Link
                  to={`/readers/${encodeURIComponent(item.username)}`}
                  className="font-semibold hover:underline inline-flex items-center gap-1.5 align-middle"
                >
                  <Avatar src={item.avatarUrl} className="w-5 h-5" />
                  {item.username}
                </Link>{" "}
                <span className="text-gray-600">{ACTIONS[item.status]}</span>{" "}
                <Link to={`/books/${encodeURIComponent(item.book_id)}`} className="font-medium hover:underline">{item.title}</Link>
                {item.author && <span className="text-gray-500"> by {item.author}</span>}
              </p>
              {item.rating && (
                <div className="mt-1" aria-label={`Rated ${item.rating} out of 5`}>
                  <StarRating rating={item.rating} />
                </div>
              )}
              {item.review && (
                <p className="text-gray-700 mt-1 line-clamp-3 whitespace-pre-line">{item.review}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                <time dateTime={item.activity_at}>{timeAgo(item.activity_at)}</time>
              </p>
            </div>
          </li>
        ))}
      </ul>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {!loading && nextCursor && (
        <button
          onClick={() => loadPage(nextCursor)}
          className="text-sm px-4 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Load more
        </button>
      )}
    </div>
  );
}
