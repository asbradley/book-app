import BookshelfNavbar from "./Header";
import BookshelfSidebar from "./sideBar/SideBar";
import RightPanel from "./RightPanel";
import Footer from "./Footer";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function MainPage({ isLoggedin }) {
  const [selectedGenre, setSelectedGenre] = useState("None");

  // The search lives in the URL (/?q=dune) so results can be shared and the
  // browser's back button returns to the previous search
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const handleSearch = (query) => {
    setSearchParams(query ? { q: query } : {});
  };

  // Picking a genre leaves search mode so the genre's books are shown
  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
    if (searchQuery) setSearchParams({});
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BookshelfNavbar
        isLoggedin={isLoggedin}
        searchQuery={searchQuery}
        onSearch={handleSearch}
      />

      <div className="flex flex-1">
        <BookshelfSidebar onGenreSelect={handleGenreSelect} />
        <RightPanel
          selectedGenre={selectedGenre}
          searchQuery={searchQuery}
          isLoggedin={isLoggedin}
        />
      </div>

      <Footer />
    </div>
  );
}
