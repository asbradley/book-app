import GenreFilter from "./GenreFilter";

export default function BookshelfSidebar({ selectedGenre, onGenreSelect }) {
  return (
    <div className="w-full max-w-xs bg-white rounded p-4">
      <GenreFilter selectedGenre={selectedGenre} onGenreSelect={onGenreSelect} />
    </div>
  );
}
