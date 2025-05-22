import BookCard from "./BookCard";

export default function Filtered({ genre, books, onBookClick }) {
  return (
    <section className="mb-10 w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{genre} Books</h2>

      <div className="flex flex-wrap gap-5">
        {books.map((book) => {
          <div key={book.id} className="w-28" onClick={() => onBookClick(book)}>
            <BookCard {...book} />
          </div>;
        })}
      </div>
    </section>
  );
}
