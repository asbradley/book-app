import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { RefreshCw, Sparkles } from "lucide-react";
import BookModal from "../mainPage/books/BookDetailed";

export default function Recommendations({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  // refresh=true asks the backend to skip its cache and generate a new set
  const fetchRecommendations = useCallback(async (refresh = false) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get("/api/history/recommendations", {
        params: refresh ? { refresh: true } : {},
      });
      setRecommendations(response.data.recommendations || []);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      // Show the backend's message when it sends one (e.g. rate limited)
      setError(err.response?.data?.message || "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchRecommendations();
  }, [userId, fetchRecommendations]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Recommended for you
        </h2>
        <button
          onClick={() => fetchRecommendations(true)}
          disabled={loading}
          className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          New picks
        </button>
      </div>

      {loading && <RecommendationSkeleton />}

      {!loading && error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && recommendations.length === 0 && (
        <p className="text-gray-500 text-sm">
          Add a few books to your list and we'll recommend what to read next.
        </p>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <ul className="space-y-4">
          {recommendations.map((book) => (
            <li
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="flex gap-4 p-3 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-16 h-24 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-24 bg-gray-100 rounded-md flex-shrink-0" />
              )}
              <div>
                <h3 className="font-medium">{book.title}</h3>
                <p className="text-gray-500 text-sm">{book.author}</p>
                <p className="text-gray-700 text-sm mt-2 italic">{book.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}

// Placeholder cards shown while recommendations are generating
function RecommendationSkeleton() {
  return (
    <ul className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <li key={i} className="flex gap-4 p-3 rounded-xl border border-gray-200">
          <div className="w-16 h-24 bg-gray-200 rounded-md" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-5/6 mt-3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
