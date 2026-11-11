import { useState, useEffect } from "react";
import { BookOpen, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import NeedAccount from "./NeedAccountPage";
import profileImage from "../../assets/blank-profile.png";
import userProfileImage from "../../assets/Girl_Reading.png"

// `searchQuery` is the active search (from the URL); `onSearch` is called with
// the new query when the user submits, or "" when they clear it.
export default function BookshelfNavbar({ isLoggedin, searchQuery = "", onSearch }) {
  const [input, setInput] = useState(searchQuery);
  const [showPopup, setshowPopup] = useState(false);

  // Keep the box in sync when the search changes elsewhere (e.g. back button,
  // or clicking the logo, which clears it)
  useEffect(() => {
    setInput(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(input.trim());
  };

  const clearSearch = () => {
    setInput("");
    onSearch?.("");
  };

  return (
    <div className="w-full bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
      {/* Left Side - Bookshelf Title */}
      {/* Will route user to MainPage when 'BookShelf is clicked */}
      <Link to="/" className="flex items-center hover:underline cursor-pointer">
        <BookOpen className="h-5 w-5 text-gray-800 mr-2" />
        <h1 className="text-lg font-semibold">Bookshelf</h1>
      </Link>

      {/* Middle - Search Bar */}
      <div className="max-w-md w-full mx-4">
        <form role="search" onSubmit={handleSubmit} className="relative">
          <div className="flex items-center border border-gray-300 rounded-full px-3 py-2 bg-gray-50">
            <Search className="h-4 w-4 text-gray-500 mr-2" />
            <input
              type="search"
              placeholder="Search books by title or author"
              aria-label="Search books"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm"
            />
            {input && (
              <button type="button" onClick={clearSearch} aria-label="Clear search">
                <X className="h-4 w-4 text-gray-500 hover:text-black" />
              </button>
            )}
          </div>
        </form>
      </div>


      {/* Right Side: User Avatar and Login Button */}
      <div className="flex items-center gap-7">
        {isLoggedin ? (
          <>
            {/* User is Logged in */}
            <Link
              to="/profile"
              className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer"
            >
              <img
                src={userProfileImage} // Make sure this is a valid image URL or a prop
                alt="User Avatar"
                className="h-full w-full object-cover"
              />
            </Link>
          </>
        ) : (
          <>
            {/* User is NOT logged in */}

            {/* Avatar */}
            <div
              onClick={() => setshowPopup(true)}
              className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer"
              title="Open user popup"
            >
              <img
                src={profileImage} // Could be a default placeholder image
                alt="User avatar"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Login Button */}
            <Link to="/login">
              <button className="text-sm px-4 py-1 border border-black rounded hover:bg-black hover:text-white transition">
                Login
              </button>
            </Link>

            {/* Optional popup */}
            {showPopup && <NeedAccount onClose={() => setshowPopup(false)} />}
          </>
        )}
      </div>
    </div>
  );
}
