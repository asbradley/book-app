import { Link } from "react-router-dom";

export default function NeedAccount({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50" // Increased opacity, added padding, and z-index
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full relative transform transition-all duration-300 scale-105" // Larger padding, rounded corners, more shadow, animation
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-semibold leading-none" // Larger, bolder close button
          onClick={onClose}
          aria-label="Close"
        >
          &times; {/* HTML entity for a larger 'x' */}
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Access Denied: Login Required!
        </h2>
        <p className="text-lg text-gray-700 mb-6 text-center">
          You must be logged in to access this feature. Please log in or sign up
          to continue and enjoy all features!
        </p>

        <div className="flex justify-center gap-7">
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105" // Larger button, better styling and hover effect
            onClick={onClose}
          >
            Got It!
          </button>

          <Link to="/login">
            <button
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105" // Larger button, better styling and hover effect
              onClick={onClose}
            >
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
