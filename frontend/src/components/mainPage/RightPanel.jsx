import BookBanner from "./BookBanner";
import BookSectionMainComp from "./BookMainComp";

export default function RightPanel() {
  return (
    <div className="flex-1 py-6 px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full">
        <BookBanner />
        <BookSectionMainComp />
      </div>
    </div>
  );
}
