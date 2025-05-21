import BookSection from "./books/BookSection";
import axios from 'axios'
import { useState, useEffect } from "react";
import BookDetail from "./books/BookDetailed";


export default function BookSectionMainComp() {

  // State to holds book based on their genre
  const [booksByGenre, setBooksByGenre] = useState({})

  // State for loading status
  const [loading, setLoading] = useState(true)

  // State for error messages as well
  const [error, setError] = useState(null);

  const [selectedBook, setSelectedBook] = useState(null);


  // Hook to fetch books 
  useEffect(() => {
    
    // 'fetchBoooks()' function to fetch books needed
    const fetchBooks = async () => {
      try {
        setLoading(true);
        
        // Make a GET request to backend to fetch
        const response = await axios.get('api/books')

        // Group the books by their genre
        const grouped = response.data.reduce((acc, book) => {

          // Check if genre already exists in the accumulator
          if (!acc[book.genre]) {
            acc[book.genre] = []; // Does not exists, creates empty arrary for that genre
          }
          acc[book.genre].push(book) // Push the book into corresponding genre
          return acc; 
        }, {});

        setBooksByGenre(grouped); // Updates the state with the grouped books based on the genre
        setLoading(false);
      } catch (error) {
        console.error("error fetching books: ", error);
        setError(error.message);
        setLoading(false)
      }
    };

    // Calls the fetchbook function
    fetchBooks()
  }, []);



  // Displays loading message
  if (loading) return <div>Loading books...</div>

  // Dsipaly error message
  if (error) return <div>Error: {error}</div>

  // Conver the bookByGenre Object to an array format for mapping
  const sections = Object.entries(booksByGenre).map(([genre, books]) => ({
    title: genre,
    books: books
  }));

  return (
    <>
      {sections.map((section, index) => (
        <BookSection
          key={index}
          title={section.title}
          books={section.books}

          onBookClick={(book) => setSelectedBook(book)}
        />
      ))}

      {selectedBook && (
        <BookDetail book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </>
  );
}
