import { useState } from "react";

export default function AwardsFilter() {
  const [selectedAward, setSelectedAward] = useState("None");

  const awards = [
    "None",
    "Pulitzer Prize",
    "Nobel Prize in Literature",
    "Man Booker Prize",
    "Newbery Medal",
    "National Book Award",
    "Hugo Award",
    "Edgar Award",
  ];

  const handleAwardClick = (award) => {
    setSelectedAward(award);
  };

  return (
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
  );
}
