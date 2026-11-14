import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Lock } from "lucide-react";
import BookshelfNavbar from "../mainPage/Header";
import StarRating from "../userPage/StarRating";
import { SHELVES } from "../userPage/shelves";
import BookCover from "./BookCover";
import FollowList from "./FollowList";
import blankAvatar from "../../assets/blank-profile.png";
import { monthYear } from "../../utils/time";

const shelfLabel = (value) => SHELVES.find((s) => s.value === value)?.label;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Public profile at /readers/:username: who they are, their follower counts,
// a Follow button, and (unless private) their shelves and reviews.
export default function ReaderProfile({ isLoggedin }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [reader, setReader] = useState(null);
  const [error, setError] = useState("");
  const [shelf, setShelf] = useState("all");
  const [openList, setOpenList] = useState(null); // "followers" | "following" | null

  useEffect(() => {
    let current = true; // ignore a slow response for a previous username
    setReader(null);
    setError("");
    setShelf("all");
    setOpenList(null);

    axios
      .get(`/api/readers/${encodeURIComponent(username)}`)
      .then((response) => current && setReader(response.data))
      .catch((err) => {
        if (!current) return;
        setError(err.response?.status === 404 ? "No reader with that username." : "Failed to load this profile.");
      });

    return () => {
      current = false;
    };
  }, [username]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Searching from here goes to the home page results */}
      <BookshelfNavbar
        isLoggedin={isLoggedin}
        onSearch={(q) => navigate(q ? `/?q=${encodeURIComponent(q)}` : "/")}
      />

      <main className="max-w-3xl w-full mx-auto p-4">
        {error && <p className="text-red-600 text-sm mt-6">{error}</p>}
        {!error && !reader && <p className="text-gray-500 text-sm mt-6">Loading profile...</p>}

        {reader && (
          <>
            <ReaderHeader
              reader={reader}
              isLoggedin={isLoggedin}
              onFollowChange={(changes) => setReader((r) => ({ ...r, ...changes }))}
              openList={openList}
              onOpenList={setOpenList}
            />

            {openList && (
              <FollowList username={reader.username} kind={openList} onClose={() => setOpenList(null)} />
            )}

            {reader.books === null ? (
              <div className="mt-10 flex flex-col items-center text-gray-500 text-sm">
                <Lock className="w-6 h-6 mb-2" aria-hidden="true" />
                <p>This profile is private.</p>
              </div>
            ) : (
              <ReaderBooks books={reader.books} shelf={shelf} onShelfChange={setShelf} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ReaderHeader({ reader, isLoggedin, onFollowChange, openList, onOpenList }) {
  const countButton = (kind, count, word) => (
    <button
      onClick={() => onOpenList(openList === kind ? null : kind)}
      disabled={reader.books === null}
      aria-expanded={openList === kind}
      className="hover:underline disabled:no-underline disabled:cursor-default"
    >
      <span className="font-semibold text-gray-900">{count}</span> {word}
    </button>
  );

  return (
    <div className="text-center mt-6">
      <img src={blankAvatar} alt="" className="w-24 h-24 rounded-full mx-auto" />
      <h1 className="text-xl font-semibold mt-2 flex items-center justify-center gap-1">
        {reader.username}
        {reader.isPrivate && <Lock className="w-4 h-4 text-gray-400" aria-label="Private profile" />}
      </h1>
      <p className="text-gray-500 text-sm">Joined {monthYear(reader.joinedAt)}</p>

      <div className="flex justify-center gap-4 mt-2 text-sm text-gray-600">
        {countButton("followers", reader.followerCount, reader.followerCount === 1 ? "follower" : "followers")}
        {countButton("following", reader.followingCount, "following")}
      </div>

      <div className="mt-4">
        {reader.isSelf ? (
          <Link to="/profile" className="inline-block bg-gray-200 px-4 py-1 rounded">
            Go to your profile
          </Link>
        ) : isLoggedin ? (
          <FollowButton reader={reader} onChange={onFollowChange} />
        ) : (
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Log in to follow {reader.username}
          </Link>
        )}
      </div>
    </div>
  );
}

export function FollowButton({ reader, onChange }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    setSaving(true);
    setError("");
    try {
      const url = `/api/readers/${encodeURIComponent(reader.username)}/follow`;
      const response = reader.isFollowing ? await axios.delete(url) : await axios.post(url);
      onChange(response.data); // { isFollowing, followerCount }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        disabled={saving}
        aria-pressed={reader.isFollowing}
        className={`px-4 py-1 rounded disabled:opacity-60 ${
          reader.isFollowing
            ? "border border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {reader.isFollowing ? "Following" : "Follow"}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </>
  );
}

function ReaderBooks({ books, shelf, onShelfChange }) {
  const visible = shelf === "all" ? books : books.filter((b) => b.status === shelf);
  const count = (value) => books.filter((b) => b.status === value).length;

  if (books.length === 0) {
    return <p className="text-gray-500 text-sm text-center mt-10">No books on their shelves yet.</p>;
  }

  return (
    <section className="mt-8">
      <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by shelf">
        {[{ value: "all", label: "All" }, ...SHELVES].map((s) => (
          <button
            key={s.value}
            onClick={() => onShelfChange(s.value)}
            aria-pressed={shelf === s.value}
            className={`text-sm px-3 py-1 rounded-full border ${
              shelf === s.value ? "bg-black text-white border-black" : "border-gray-300 text-gray-700"
            }`}
          >
            {s.label} ({s.value === "all" ? books.length : count(s.value)})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-gray-500 text-sm mt-6">Nothing on this shelf.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((book) => (
            <li key={book.book_id} className="flex gap-4 p-3 rounded-xl border border-gray-200">
              <BookCover src={book.cover_image} title={book.title} className="w-16 h-24" />
              <div className="min-w-0">
                <h3 className="font-medium">{book.title}</h3>
                <p className="text-gray-500 text-sm">{book.author}</p>
                <p className="text-xs text-gray-500 mt-1">{shelfLabel(book.status)}</p>
                {book.rating && (
                  <div className="mt-1" aria-label={`Rated ${plural(book.rating, "star")}`}>
                    <StarRating rating={book.rating} />
                  </div>
                )}
                {book.review && (
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{book.review}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
