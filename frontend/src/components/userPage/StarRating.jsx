import { useState } from "react";
import { Star } from "lucide-react";

// 1-5 star rating. Pass `onChange` to make it clickable; omit it for display only.
// Clicking the current rating again clears it (calls onChange(null)).
export default function StarRating({ rating, onChange }) {
  const [hovered, setHovered] = useState(null);
  const shown = hovered ?? rating ?? 0;
  const interactive = Boolean(onChange);

  return (
    <div className="flex" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((value) => {
        const star = (
          <Star
            className={`w-4 h-4 ${
              value <= shown ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        );

        if (!interactive) return <span key={value}>{star}</span>;

        return (
          <button
            key={value}
            type="button"
            aria-label={`Rate ${value} out of 5`}
            onMouseEnter={() => setHovered(value)}
            onClick={() => onChange(value === rating ? null : value)}
            className="p-0.5"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
