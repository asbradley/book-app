import AwardsFilter from "./AwardsFilter";
import GenreFilter from "./GenreFilter";

export default function BookshelfSidebar({ onGenreSelect }) {
  return (
    <div className="w-full max-w-xs bg-white rounded p-4">
      <GenreFilter onGenreSelect={onGenreSelect}/>
      <AwardsFilter />
    </div>
  );
}
