import BookBanner from "./books/BookBanner";
import BookSectionMainComp from "./books/BookMainComp";
import Filtered from "./books/Filtered";

export default function RightPanel({ selectedGenre}) {
  console.log("RightPanel received genre:", selectedGenre); // DEBUGGIN

  return (
    <div className="flex-1 py-6 px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full">
        <BookBanner />

        {selectedGenre === "None" ? (
          <BookSectionMainComp />

        ) : (
          <Filtered genre={selectedGenre} />
        )}
      </div>
    </div>
  );
}
