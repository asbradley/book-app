// Genres shown in the sidebar. "None" returns to the home page sections.
export const GENRES = [
  "None",
  "Science Fiction",
  "Mystery",
  "Fantasy",
  "Romance",
  "Thriller",
  "Horror",
  "Historical Fiction",
];

// Controlled by MainPage, which keeps the selection in the URL. While a search
// is showing, `selectedGenre` is null so no genre appears selected.
export default function GenreFilter({ selectedGenre, onGenreSelect }) {
  return (
    <fieldset className="mb-6">
      <legend className="text-md font-medium mb-3">Genre</legend>
      {GENRES.map((genre) => (
        <label
          key={genre}
          className={`flex items-center border rounded-lg px-3 py-2 mb-2 cursor-pointer transition ${
            selectedGenre === genre ? "bg-gray-50 border-black" : "bg-white border-gray-200"
          }`}
        >
          <input
            type="radio"
            name="genre"
            checked={selectedGenre === genre}
            onChange={() => onGenreSelect(genre)}
            className="mr-2 h-4 w-4 accent-black"
          />
          <span className="text-sm">{genre}</span>
        </label>
      ))}
    </fieldset>
  );
}
