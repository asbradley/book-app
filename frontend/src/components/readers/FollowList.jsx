import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { X } from "lucide-react";

// Inline list of a reader's followers or the readers they follow
export default function FollowList({ username, kind, onClose }) {
  const [names, setNames] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    setNames(null);
    setError("");
    axios
      .get(`/api/readers/${encodeURIComponent(username)}/${kind}`)
      .then((response) => current && setNames(response.data))
      .catch(() => current && setError(`Failed to load ${kind}.`));
    return () => {
      current = false;
    };
  }, [username, kind]);

  const title = kind === "followers" ? "Followers" : "Following";

  return (
    <section className="mt-6 p-4 rounded-xl border border-gray-200" aria-label={title}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">{title}</h2>
        <button onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
          <X className="w-4 h-4 text-gray-500 hover:text-black" />
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !names && <p className="text-sm text-gray-500">Loading...</p>}
      {names?.length === 0 && (
        <p className="text-sm text-gray-500">{kind === "followers" ? "No followers yet." : "Not following anyone yet."}</p>
      )}
      {names?.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {names.map((name) => (
            <li key={name}>
              <Link
                to={`/readers/${encodeURIComponent(name)}`}
                className="inline-block text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
