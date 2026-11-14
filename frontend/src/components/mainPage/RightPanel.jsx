import BookBanner from "./books/BookBanner";
import BookSectionMainComp from "./books/BookMainComp";
import BookResults from "./books/BookResults";

// Main content area: search results when searching, otherwise the selected
// genre, otherwise the home page sections.
export default function RightPanel({ selectedGenre, searchQuery, isLoggedin, onGenreSelect }) {
  let content;
  if (searchQuery) {
    content = (
      <BookResults
        title={`Results for "${searchQuery}"`}
        fetchUrl={`/api/books/search?q=${encodeURIComponent(searchQuery)}`}
        emptyMessage={`No books found for "${searchQuery}".`}
        isLoggedin={isLoggedin}
      />
    );
  } else if (selectedGenre === "None") {
    content = <BookSectionMainComp isLoggedin={isLoggedin} />;
  } else {
    content = (
      <BookResults
        title={`${selectedGenre} Books`}
        fetchUrl={`/api/genre/${encodeURIComponent(selectedGenre)}`}
        emptyMessage={`No books in the ${selectedGenre} genre.`}
        isLoggedin={isLoggedin}
      />
    );
  }

  return (
    <div className="flex-1 py-6 px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full">
        {/* Only on the home view, so search and genre results show right away */}
        {!searchQuery && selectedGenre === "None" && (
          <BookBanner onExplore={() => onGenreSelect("Science Fiction")} />
        )}
        {content}
      </div>
    </div>
  );
}
