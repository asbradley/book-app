import BookCard from "./BookCard";
import axios from "axios";
import { useState, useEffect } from "react";
import BookDetail from "./BookDetailed";

export default function Filtered({ genre }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [books, setBooks] = useState([]);

  const [selectedBook, setSelectedBook] = useState(null); // NOT SURE IF NEEDED

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`api/genre/${encodeURIComponent(genre)}`);
        
        setBooks(response.data);
        setLoading(false);
      } catch (error) {
        console.log(`Error fetching books from genre ${genre}`);
        setError(error);
        setLoading(false);
      }
    };

    fetchBooks();
  }, [genre]);

  if (loading) return <div>Loading books...</div>

  if (error) return <div>Error: {error}</div>

  if (!books.length) return <div>No Books in {genre} genre.</div>

  return (
    <section className="mb-10 w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{genre} Books</h2>

      <div className="flex flex-wrap gap-5">
        {books.map((book) => (
          <div key={book.id} className="w-28 cursor-pointer" onClick={() => setSelectedBook(book)}>
            <BookCard {...book} />
          </div>
        ))}
      </div>

      {selectedBook && (
        <BookDetail book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </section>
  );
}
