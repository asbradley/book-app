export default function BookModal({ book, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl font-bold"
        >
          &times;
        </button>

        {/* Modal content layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover image on the left */}
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full md:w-48 h-64 object-cover rounded-md"
          />

          {/* Title and author on the right */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{book.title}</h2>
            <p className="text-md text-gray-600 mb-4">by {book.author}</p>

            {/* Description below */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {book.description || "No description available."}
            </p>

            {/* Link to book */}
            {book.link && (
              <a
                href={book.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Learn More
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
