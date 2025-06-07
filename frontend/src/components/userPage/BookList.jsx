import React, { useState } from "react";
import AddBookModal from "./AddBookModal";

export default function BookList() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSearch(true)}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
      >
        Add a Book
      </button>

      {showSearch ? (
        <AddBookModal onClose={() => setShowSearch(false)} />
      ) : null}
    </>
  );
}
