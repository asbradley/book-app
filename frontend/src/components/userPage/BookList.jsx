import { useState, useEffect } from "react";
import AddBookModal from "./AddBookModal";
import axios from "axios";


export default function BookList({ userId }) {
  const [showSearch, setShowSearch] = useState(false);
  const [books, setBooks] = useState([]);


  // Load the users books from their history
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(`/api/history/user-books?user_id=${userId}`);        setBooks(response.data)
      } catch (error) {
        console.error("Error fetching books:", error)
      }
    }
    fetchBooks()
  }, [userId]);





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
          userId={userId}
        />
      )}

      <ul className="mt-6 space-y-4">
        {books.map((book) => (
          <li key={book.id} className="flex items-start space-x-4">
            
            {/* THIS WAS coverImage */}
            <img
              src={book.cover_image} 


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
