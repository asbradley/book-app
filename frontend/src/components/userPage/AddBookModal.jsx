import { useState, useEffect } from "react";
import axios from "axios";

export default function AddBookModal({ onClose, onBookSelect, userId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  const [loading, setLoading] = useState(false);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Trigger API call
  useEffect(() => {
    const fetchBooks = async () => {
      if (debouncedTerm.length < 3) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await axios.get(
          `/api/history/user-search?q=${debouncedTerm}`
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error("Error fetching books:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [debouncedTerm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-600 hover:text-black text-xl"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">Search for a Book</h2>
        <input
          type="text"
          placeholder="Enter book title or author"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Search Results */}
        <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : debouncedTerm.length >= 3 && searchResults.length === 0 ? (
            <p className="text-sm text-gray-500">No results found.</p>
          ) : (
            searchResults.map((book) => (
              <div
                key={book.id}
                className="flex items-start space-x-3 p-2 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={async () => {
                  try {
                    await axios.post("/api/history/user-books", {
                      user_id: userId,
                      book_id: book.id,
                      title: book.title,
                      author: book.author,
                      cover_image: book.coverImage,
                    });

                    // Calls prop to update UI state
                    onBookSelect(book);
                    onClose() // Close modal after adding

                  } catch (err) {
                    console.error("Error saving book to DB:", err)
                  }
                }}
              >
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{book.title}</h3>
                  <p className="text-sm text-gray-600">by {book.author}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
