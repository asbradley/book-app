import { Link } from "react-router-dom";
import AddToShelf from "./AddToShelf";
import CommunityReviews from "./CommunityReviews";
import BookCover from "../../readers/BookCover";

// A book's cover, details, shelf button and community reviews. Shared by the
// popup on the home page and the book's own page at /books/:bookId.
// `book` is in the frontend book shape; the extra fields (authors,
// publishedDate, pageCount, categories) only come from the single-book
// endpoint, so each is shown only when present.
export default function BookDetails({ book, isLoggedin, headingLevel = "h2" }) {
  const Heading = headingLevel;
  const authors = book.authors?.length ? book.authors.join(", ") : book.author;
  const facts = [
    book.publishedDate && `Published ${book.publishedDate}`,
    book.pageCount && `${book.pageCount} pages`,
    ...(book.categories || []),
  ].filter(Boolean);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <BookCover src={book.coverImage} title={book.title} className="w-full md:w-48 h-64 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <Heading className="text-2xl font-bold text-gray-800">{book.title}</Heading>
        <p className="text-md text-gray-600">by {authors}</p>

        {facts.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-3" aria-label="Book details">
            {facts.map((fact) => (
              <li key={fact} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {fact}
              </li>
            ))}
          </ul>
        )}

        <p className="text-gray-700 text-sm leading-relaxed mt-4 whitespace-pre-line">
          {book.description || "No description available."}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          {isLoggedin ? (
            <AddToShelf book={book} />
          ) : (
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Log in to add this book to your shelves
            </Link>
          )}

          {book.link && (
            <a
              href={book.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              View on Google Books
            </a>
          )}
        </div>

        <CommunityReviews bookId={book.id} />
      </div>
    </div>
  );
}
