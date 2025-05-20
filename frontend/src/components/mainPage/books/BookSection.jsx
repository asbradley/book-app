// frontend/src/components/books/BookSection.jsx
import BookCard from "./BookCard";

export default function BookSection({ title, books }) {
  return (
    <section className="mb-10 w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      <div className="flex flex-wrap gap-5"> {/* Increased gap for better visual separation */}
        {books.map((book) => (
          <div key={book.id} className="w-28"> {/* Fixed width card container */}
            <BookCard {...book} />
          </div>
        ))}
      </div>
    </section>
  );
}