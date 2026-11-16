import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BookshelfNavbar from "../mainPage/Header";
import Footer from "../mainPage/Footer";
import BookDetails from "../mainPage/books/BookDetails";

// A book's own page at /books/:bookId, so a book can be linked to and shared.
// Shows the same details as the home page popup, plus a few more facts.
export default function BookPage({ isLoggedin, user }) {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true; // ignore a slow response for a previous book
    setBook(null);
    setError("");

    axios
      .get(`/api/books/${encodeURIComponent(bookId)}`)
      .then((response) => current && setBook(response.data))
      .catch((err) => {
        if (!current) return;
        setError(err.response?.status === 404 ? "We couldn't find that book." : "Failed to load this book.");
      });

    return () => {
      current = false;
    };
  }, [bookId]);

  // Name the tab after the book, and put it back when leaving the page
  useEffect(() => {
    if (!book) return;
    const previous = document.title;
    document.title = `${book.title} | Bookshelf`;
    return () => {
      document.title = previous;
    };
  }, [book]);

  return (
    <div className="min-h-screen flex flex-col">
      <BookshelfNavbar
        isLoggedin={isLoggedin}
        avatarUrl={user?.avatarUrl}
        onSearch={(q) => navigate(q ? `/?q=${encodeURIComponent(q)}` : "/")}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {error && <p className="text-red-600 text-sm mt-6">{error}</p>}
        {!error && !book && <p className="text-gray-500 text-sm mt-6">Loading book...</p>}
        {book && <BookDetails book={book} isLoggedin={isLoggedin} headingLevel="h1" />}
      </main>

      <Footer />
    </div>
  );
}
