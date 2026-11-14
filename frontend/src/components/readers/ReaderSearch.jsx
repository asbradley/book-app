import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Search } from "lucide-react";

// "Find readers" box: searches usernames and links to their profiles
export default function ReaderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const search = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError("Enter at least 2 characters.");
      return;
    }
    setError("");
    try {
      const response = await axios.get("/api/readers/search", { params: { q } });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed. Please try again.");
    }
  };

  return (
    <div>
      <form role="search" onSubmit={search} className="flex gap-2">
        <div className="flex flex-1 items-center border border-gray-300 rounded-lg px-3 py-1.5">
          <Search className="h-4 w-4 text-gray-500 mr-2" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find readers by username"
            aria-label="Find readers"
            className="w-full text-sm outline-none"
          />
        </div>
        <button type="submit" className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black">
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {results?.length === 0 && <p className="text-sm text-gray-500 mt-2">No readers found.</p>}
      {results?.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-3">
          {results.map((name) => (
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
    </div>
  );
}
