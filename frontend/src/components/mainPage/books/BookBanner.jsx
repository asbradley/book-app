import image from "../../../assets/Girl_Reading.png";

// Home page banner. "Explore" opens the Science Fiction genre it advertises.
export default function BookBanner({ onExplore }) {
  return (
    <div className="mb-8 w-full relative h-64 rounded-lg overflow-hidden bg-teal-700">
      {/* Decorative, so it has empty alt text */}
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />

      <div className="absolute inset-0 flex flex-col justify-center p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Travel to another world</h2>
        <p className="mb-4">Find your next favorite read in our top science fiction picks</p>
        <button
          onClick={onExplore}
          className="bg-blue-500 text-white px-4 py-2 rounded w-fit hover:bg-blue-600"
        >
          Explore science fiction
        </button>
      </div>
    </div>
  );
}
