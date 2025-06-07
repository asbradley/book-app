import { useState } from "react";


export default function AddBookModal({ onClose }) {
    const [searchTerm, setSearchTerm] = useState("");
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-600 hover:text-black text-xl"
          >
            &times;
          </button>
          <h2 className="text-xl font-semibold mb-4">Search for a Book</h2>
          <input
            type="text"
            placeholder="Enter book title or author"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  }
  