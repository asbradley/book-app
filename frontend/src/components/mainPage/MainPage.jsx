import BookshelfNavbar from "./Header";
import BookshelfSidebar from "./sideBar/SideBar";
import RightPanel from "./RightPanel";
import Footer from "./Footer";
import { useSearchParams } from "react-router-dom";

export default function MainPage({ isLoggedin, user }) {
  // The search and genre live in the URL (/?q=dune, /?genre=Fantasy) so a view
  // can be shared or bookmarked and the back button returns to the previous
  // one. Only one is active at a time: searching leaves the genre and vice versa.
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const selectedGenre = searchParams.get("genre") || "None";

  const handleSearch = (query) => {
    setSearchParams(query ? { q: query } : {});
  };

  const handleGenreSelect = (genre) => {
    setSearchParams(genre === "None" ? {} : { genre });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BookshelfNavbar
        isLoggedin={isLoggedin}
        avatarUrl={user?.avatarUrl}
        searchQuery={searchQuery}
        onSearch={handleSearch}
      />

      <div className="flex flex-1">
        <BookshelfSidebar
          selectedGenre={searchQuery ? null : selectedGenre}
          onGenreSelect={handleGenreSelect}
        />
        <RightPanel
          selectedGenre={selectedGenre}
          searchQuery={searchQuery}
          isLoggedin={isLoggedin}
          onGenreSelect={handleGenreSelect}
        />
      </div>

      <Footer />
    </div>
  );
}
