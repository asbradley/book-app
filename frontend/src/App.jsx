
// frontend/src/App.jsx
import BookshelfNavbar from "./components/Header"; // Import the header component
import BookshelfSidebar from "./components/SideBar";
import BookSection from "./components/books/BookSection";
import data from "./data";

export default function App() {
  // Sample data for different genres
  const sections = [
    {
      title: "Science Fiction",
      books: data, // Replace with actual sci-fi book data if available
    },
    {
      title: "Romance",
      books: data, // Replace with actual romance book data if available
    },
    {
      title: "Mystery",
      books: data, // Replace with actual mystery book data if available
    },
  ];

  return (
    <div className="flex flex-col h-screen">
      <BookshelfNavbar /> {/* Add the header here */}
      <div className="flex flex-1">
        <BookshelfSidebar />
        <div className="flex-1 p-4 overflow-y-auto">
          {sections.map((section, index) => (
            <BookSection key={index} title={section.title} books={section.books} />
          ))}
        </div>
      </div>
    </div>
  );
}