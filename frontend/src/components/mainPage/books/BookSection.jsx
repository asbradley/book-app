// frontend/src/components/books/BookSection.jsx
import BookCard from "./BookCard";

export default function BookSection({ title, books, onBookClick }) {
  return (
    <section className="mb-10 w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      <div
        className="grid grid-cols-auto-fit gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))" }}
      >
        {books.map((book) => (
          <div key={book.id} className="w-28" onClick={() => onBookClick(book)}>
            <BookCard {...book} />
          </div>
        ))}
      </div>
    </section>
  );
}
