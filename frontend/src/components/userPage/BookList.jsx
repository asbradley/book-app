import React, { useState } from "react";
import AddBookModal from "./AddBookModal";

export default function BookList() {
  const [showSearch, setShowSearch] = useState(false);
  const [books, setBooks] = useState([]);

  const handleAddBook = (book) => {
    setBooks((prevBooks) => [...prevBooks, book]);
    setShowSearch(false); // Close modal after adding a book
  };

  return (
    <>
      {showSearch && (
        <AddBookModal
          onClose={() => setShowSearch(false)}
          onBookSelect={handleAddBook}
        />
      )}

      <ul className="mt-6 space-y-4">
        {books.map((book) => (
          <li key={book.id} className="flex items-start space-x-4">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-16 h-24 object-cover"
            />
            <div>
              <h3 className="font-medium">{book.title}</h3>
              <p className="text-gray-500 text-sm">{book.author}</p>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setShowSearch(true)}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
      >
        Add a Book
      </button>
    </>
  );
}
