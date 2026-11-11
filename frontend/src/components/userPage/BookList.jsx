import { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, PenLine } from "lucide-react";
import AddBookModal from "./AddBookModal";
import StarRating from "./StarRating";
import { SHELVES } from "./shelves";

const bookUrl = (bookId) => `/api/history/user-books/${encodeURIComponent(bookId)}`;

export default function BookList({ userId }) {
  const [showSearch, setShowSearch] = useState(false);
  const [books, setBooks] = useState([]);
  const [shelfFilter, setShelfFilter] = useState("all");
  const [error, setError] = useState("");

  // Load the user's saved books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get("/api/history/user-books");
        setBooks(response.data);
      } catch (error) {
        console.error("Error fetching books:", error);
        setError("Failed to load your books.");
      }
    };
    fetchBooks();
  }, [userId]);

  // `book` is the saved row returned by the backend, so it renders like the rest
  const handleAddBook = (book) => {
    setBooks((prevBooks) => [book, ...prevBooks]);
    setShowSearch(false);
  };

  // Saves shelf/rating/review changes and swaps in the updated row
  const updateBook = async (bookId, changes) => {
    setError("");
    try {
      const response = await axios.patch(bookUrl(bookId), changes);
      setBooks((prev) => prev.map((b) => (b.book_id === bookId ? response.data : b)));
      return true;
    } catch (error) {
      console.error("Error updating book:", error);
      setError(error.response?.data?.message || "Failed to update book.");
      return false;
    }
  };

  const removeBook = async (bookId) => {
    setError("");
    try {
      await axios.delete(bookUrl(bookId));
      setBooks((prev) => prev.filter((b) => b.book_id !== bookId));
    } catch (error) {
      console.error("Error removing book:", error);
      setError("Failed to remove book.");
    }
  };

  const visibleBooks =
    shelfFilter === "all" ? books : books.filter((b) => b.status === shelfFilter);

  const countFor = (shelf) => books.filter((b) => b.status === shelf).length;

  return (
    <>
      {showSearch && (
        <AddBookModal onClose={() => setShowSearch(false)} onBookSelect={handleAddBook} />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Shelf filter */}
        <div className="flex gap-2 flex-wrap">
          {[{ value: "all", label: "All" }, ...SHELVES].map((shelf) => (
            <button
              key={shelf.value}
              onClick={() => setShelfFilter(shelf.value)}
              className={`text-sm px-3 py-1 rounded-full border ${
                shelfFilter === shelf.value
                  ? "bg-black text-white border-black"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {shelf.label} ({shelf.value === "all" ? books.length : countFor(shelf.value)})
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowSearch(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm"
        >
          Add a Book
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {visibleBooks.length === 0 ? (
        <p className="text-gray-500 text-sm mt-6">
          {books.length === 0
            ? "Your shelves are empty. Add a book to get started."
            : "No books on this shelf yet."}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {visibleBooks.map((book) => (
            <BookRow
              key={book.book_id}
              book={book}
              onUpdate={(changes) => updateBook(book.book_id, changes)}
              onRemove={() => removeBook(book.book_id)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

// One saved book with its shelf, rating, review and remove controls
function BookRow({ book, onUpdate, onRemove }) {
  const [editingReview, setEditingReview] = useState(false);
  const [draft, setDraft] = useState(book.review || "");

  const saveReview = async () => {
    const saved = await onUpdate({ review: draft });
    if (saved) setEditingReview(false);
  };

  return (
    <li className="flex items-start gap-4 p-3 rounded-xl border border-gray-200">
      {book.cover_image ? (
        <img
          src={book.cover_image}
          alt={book.title}
          className="w-16 h-24 object-cover rounded-md flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-24 bg-gray-100 rounded-md flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium truncate">{book.title}</h3>
            <p className="text-gray-500 text-sm">{book.author}</p>
          </div>
          <button
            onClick={onRemove}
            aria-label={`Remove ${book.title}`}
            className="text-gray-400 hover:text-red-600 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <select
            value={book.status}
            onChange={(e) => onUpdate({ status: e.target.value })}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1"
          >
            {SHELVES.map((shelf) => (
              <option key={shelf.value} value={shelf.value}>
                {shelf.label}
              </option>
            ))}
          </select>

          <StarRating rating={book.rating} onChange={(rating) => onUpdate({ rating })} />

          {!editingReview && (
            <button
              onClick={() => {
                setDraft(book.review || "");
                setEditingReview(true);
              }}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-black"
            >
              <PenLine className="w-4 h-4" />
              {book.review ? "Edit review" : "Write review"}
            </button>
          )}
        </div>

        {editingReview ? (
          <div className="mt-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="What did you think?"
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={saveReview}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingReview(false)}
                className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          book.review && <p className="text-sm text-gray-700 mt-2 italic">“{book.review}”</p>
        )}
      </div>
    </li>
  );
}
