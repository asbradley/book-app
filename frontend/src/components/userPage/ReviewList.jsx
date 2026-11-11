import { useState, useEffect } from "react";
import axios from "axios";
import StarRating from "./StarRating";

// Shows every book the user has written a review for, most recently updated first.
// Reviews are written and edited from the Books tab.
export default function ReviewList({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get("/api/history/user-books");
        const reviewed = response.data
          .filter((book) => book.review)
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setReviews(reviewed);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [userId]);

  if (loading) return <p className="text-gray-500 text-sm">Loading reviews...</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;

  if (reviews.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        No reviews yet. Use "Write review" on any book in the Books tab.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((book) => (
        <li key={book.book_id} className="flex gap-4 p-3 rounded-xl border border-gray-200">
          {book.cover_image ? (
            <img
              src={book.cover_image}
              alt={book.title}
              className="w-16 h-24 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-24 bg-gray-100 rounded-md flex-shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="font-medium">{book.title}</h3>
            <p className="text-gray-500 text-sm">{book.author}</p>
            {book.rating && (
              <div className="mt-1">
                <StarRating rating={book.rating} />
              </div>
            )}
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{book.review}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
