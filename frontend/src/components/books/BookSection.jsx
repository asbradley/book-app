import BookCard from "./BookCard";

export default function BookSection({ title, books }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
      <div className="flex space-x-4 overflow-x-auto">
        {books.map((book) => (
          <BookCard key={book.id} {...book} />
        ))}
      </div>
    </section>
  );
}