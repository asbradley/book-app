import { useState } from "react";
import BookList from "./BookList";

export default function ProfileTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex justify-center mt-6 space-x-4 text-gray-500">
      {["Books", "Reviews", "Recommendations"].map((tab) => (
        <button
          key={tab}
          className={`pb-2 ${
            activeTab === tab ? "border-b-2 font-medium text-black" : ""
          }`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
