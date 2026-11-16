import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import BookDetails from "./BookDetails";

// Book detail popup, with a link to the book's own page (which can be shared)
export default function BookModal({ book, onClose, isLoggedin = false }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl font-bold"
        >
          &times;
        </button>

        <BookDetails book={book} isLoggedin={isLoggedin} />

        {book.id && (
          <Link
            to={`/books/${encodeURIComponent(book.id)}`}
            className="mt-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-black hover:underline"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Open book page
          </Link>
        )}
      </div>
    </div>
  );
}
