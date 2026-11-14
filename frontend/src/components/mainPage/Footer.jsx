import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <Link to="/" className="flex items-center gap-2 text-gray-900 font-semibold hover:underline">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Bookshelf
        </Link>

        {/* Google Books API terms ask for attribution where its data is shown */}
        <p>
          Book data from{" "}
          <a
            href="https://books.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:underline"
          >
            Google Books
          </a>
        </p>

        <a
          href="https://github.com/asbradley/book-app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:underline"
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
