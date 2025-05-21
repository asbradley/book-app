import image from "../../../assets/Girl_Reading.png";


  export default function BookBanner() {
    return (
      <div className="mb-8 w-full relative h-64 rounded-lg overflow-hidden bg-teal-700">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={image} /* Placeholder for your image */
            alt="Banner"
            className="w-full h-full object-cover opacity-70"
          />
        </div>
        
        {/* Text Overlay */}
        <div className="absolute inset-0 flex flex-col justify-center p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Travel to another world</h1>
          <p className="mb-4">Find your next favorite read in our top picks for science fiction and fantasy books</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded w-32">Explore</button>
        </div>
      </div>
    );
  }