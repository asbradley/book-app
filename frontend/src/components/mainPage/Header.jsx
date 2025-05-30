import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Link } from "react-router-dom";
import NeedAccount from "./NeedAccountPage";
import profileImage from "../../assets/blank-profile.png"

export default function BookshelfNavbar() {
  const [searchQuery, setSearchQuery] = useState("");

  const [showPopup, setshowPopup] = useState(false);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
        <div className="relative">
          <div className="flex items-center border border-gray-300 rounded-full px-3 py-2 bg-gray-50">
            <Search className="h-4 w-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none outline-none w-full text-sm"
            />
          </div>
        </div>
      </div>

      {/* Right Side: User Avatar */}
      <div className="flex items-center">
        <div
          onClick={() => setshowPopup(true)}
          className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer"
          title="Open user popup"
        >
          <img
            src={profileImage}
            alt="User avatar"
            className="h-full w-full object-cover"
          />
        </div>

        {showPopup ? <NeedAccount onClose={() => setshowPopup(false)} /> : null}
      </div>
    </div>
  );
}
