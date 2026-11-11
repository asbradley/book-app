import { useState } from "react";
import axios from "axios";
import { Check } from "lucide-react";
import { SHELVES } from "../../userPage/shelves";

// Shelf picker + button that saves a Google Books result to the user's shelves.
// `book` is in the frontend book shape ({ id, title, author, coverImage }).
export default function AddToShelf({ book }) {
  const [shelf, setShelf] = useState("want_to_read");
  // idle | saving | added | duplicate | expired | error
  const [status, setStatus] = useState("idle");

  const addBook = async () => {
    setStatus("saving");
    try {
      await axios.post("/api/history/user-books", {
        book_id: book.id,
        title: book.title,
        author: book.author,
        cover_image: book.coverImage,
        status: shelf,
      });
      setStatus("added");
    } catch (err) {
      const code = err.response?.status;
      if (code === 409) setStatus("duplicate");
      else if (code === 401 || code === 403) setStatus("expired"); // tokens last 24h
      else setStatus("error");
    }
  };

  if (status === "added") {
    const label = SHELVES.find((s) => s.value === shelf).label;
    return (
      <p className="flex items-center gap-1 text-sm text-green-700">
        <Check className="w-4 h-4" /> Added to {label}
      </p>
    );
  }

  if (status === "duplicate") {
    return <p className="text-sm text-gray-600">This book is already on your shelves.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <select
          value={shelf}
          onChange={(e) => setShelf(e.target.value)}
          aria-label="Shelf"
          className="text-sm border border-gray-300 rounded px-2 py-2"
        >
          {SHELVES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={addBook}
          disabled={status === "saving"}
          className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {status === "saving" ? "Adding..." : "Add to shelf"}
        </button>
      </div>
      {status === "expired" && (
        <p className="text-sm text-red-600 mt-2">Your session has expired. Please log in again.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600 mt-2">Couldn't add this book. Please try again.</p>
      )}
    </div>
  );
}
