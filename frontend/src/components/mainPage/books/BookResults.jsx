import { useState, useEffect } from "react";
import axios from "axios";
import BookCard from "./BookCard";
import BookDetail from "./BookDetailed";

// Grid of books loaded from `fetchUrl` (genre results, search results, etc.).
// Clicking a book opens its detail modal.
export default function BookResults({ title, fetchUrl, emptyMessage, isLoggedin }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    // Ignore responses that arrive after the URL changed (e.g. the user
    // searched again), so older results never overwrite newer ones
    let ignore = false;

    const fetchBooks = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(fetchUrl);
        if (!ignore) setBooks(response.data);
      } catch (err) {
        console.error(`Error fetching ${fetchUrl}:`, err);
        if (!ignore) setError(err.response?.data?.message || "Failed to load books.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchBooks();
    return () => {
      ignore = true;
    };
  }, [fetchUrl]);

  if (loading) return <div>Loading books...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!books.length) return <div>{emptyMessage}</div>;

  return (
    <section className="mb-10 w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      <div
        className="grid grid-cols-auto-fit gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))" }}
      >
        {books.map((book) => (
          <div key={book.id} className="cursor-pointer" onClick={() => setSelectedBook(book)}>
            <BookCard {...book} />
          </div>
        ))}
      </div>

      {selectedBook && (
        <BookDetail
          book={selectedBook}
          isLoggedin={isLoggedin}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </section>
  );
}
