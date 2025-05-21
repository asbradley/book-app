import { useState } from "react";

export default function BookshelfSidebar() {
  const [selectedGenre, setSelectedGenre] = useState("Science Fiction");
  const [selectedAward, setSelectedAward] = useState("Pulitzer Prize");

  const genres = [
    "Science Fiction",
    "Mystery",
    "Fantasy",
    "Romance",
    "Thriller",
    "Horror",
    "Historical Fiction",
  ];

  const awards = [
    "Pulitzer Prize",
    "Nobel Prize in Literature",
    "Man Booker Prize",
    "Newbery Medal",
    "National Book Award",
    "Hugo Award",
    "Edgar Award",
  ];

  const handleGenreClick = (genre) => {
    setSelectedGenre(genre);
  };

  const handleAwardClick = (award) => {
    setSelectedAward(award);
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

      {/* Awards Section */}
      <div>
        <h2 className="text-md font-medium mb-3">Awards</h2>
        {awards.map((award) => (
          <div key={award}>
            <label
              className={`flex items-center border rounded-lg px-3 py-2 mb-2 cursor-pointer transition 
          ${
            selectedAward === award
              ? "bg-gray-50 border-black"
              : "bg-white border-gray-200"
          }
        `}
            >
              <input
                type="radio"
                name="award"
                checked={selectedAward === award}
                onChange={() => handleAwardClick(award)}
                className="mr-2 h-4 w-4 accent-black"
              />
              <span className="text-sm">{award}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
