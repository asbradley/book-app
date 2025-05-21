import { useState } from "react";

export default function GenreFilter() {
  const [selectedGenre, setSelectedGenre] = useState("None");

  const genres = [
    "None",
    "Science Fiction",
    "Mystery",
    "Fantasy",
    "Romance",
    "Thriller",
    "Horror",
    "Historical Fiction",
  ];

  const handleGenreClick = (genre) => {
    setSelectedGenre(genre);
  };

  return (
    <div className="w-full max-w-xs bg-white rounded p-4">
      {/* Genre Section */}
      <div className="mb-6">
        <h2 className="text-md font-medium mb-3">Genre</h2>
        {genres.map((genre) => (
          <div key={genre}>
            <label
              className={`flex items-center border rounded-lg px-3 py-2 mb-2 cursor-pointer transition 
          ${
            selectedGenre === genre
              ? "bg-gray-50 border-black"
              : "bg-white border-gray-200"
          }
        `}
            >
              <input
                type="radio"
                name="genre"
                checked={selectedGenre === genre}
                onChange={() => handleGenreClick(genre)}
                className="mr-2 h-4 w-4 accent-black"
              />
              <span className="text-sm">{genre}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
