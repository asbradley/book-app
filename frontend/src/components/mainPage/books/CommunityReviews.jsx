import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Star } from "lucide-react";
import StarRating from "../../userPage/StarRating";
import { timeAgo } from "../../../utils/time";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// "What readers think": average rating and recent reviews from public profiles
export default function CommunityReviews({ bookId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    setData(null);
    setError(false);
    axios
      .get(`/api/books/${encodeURIComponent(bookId)}/reviews`)
      .then((response) => current && setData(response.data))
      .catch(() => current && setError(true));
    return () => {
      current = false;
    };
  }, [bookId]);

  return (
    <section className="mt-6 pt-4 border-t border-gray-200" aria-labelledby="community-reviews">
      <h3 id="community-reviews" className="font-semibold text-gray-900">
        What readers think
      </h3>

      {error && <p className="text-sm text-gray-500 mt-2">Reader reviews couldn't be loaded.</p>}
      {!error && !data && <p className="text-sm text-gray-500 mt-2">Loading reviews...</p>}

      {data && (
        <>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            {data.averageRating !== null && (
              <>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                <span className="font-semibold text-gray-900">{data.averageRating.toFixed(1)}</span>
                <span>from {plural(data.ratingCount, "rating")} ·</span>
              </>
            )}
            <span>
              {data.readerCount === 0
                ? "No readers have shelved this book yet."
                : `${plural(data.readerCount, "reader")} ${data.readerCount === 1 ? "has" : "have"} this on their shelves`}
            </span>
          </p>

          {data.reviews.length > 0 && (
            <ul className="mt-3 space-y-3">
              {data.reviews.map((review) => (
                <li key={review.username} className="text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/readers/${encodeURIComponent(review.username)}`}
                      className="font-semibold hover:underline"
                    >
                      {review.username}
                    </Link>
                    {review.rating && (
                      <span aria-label={`Rated ${review.rating} out of 5`}>
                        <StarRating rating={review.rating} />
                      </span>
                    )}
                    <time dateTime={review.updated_at} className="text-xs text-gray-500">
                      {timeAgo(review.updated_at)}
                    </time>
                  </div>
                  <p className="text-gray-700 mt-1 whitespace-pre-line">{review.review}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
