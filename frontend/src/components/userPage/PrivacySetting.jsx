import { useState, useEffect } from "react";
import axios from "axios";

// Public/private profile switch. Saves as soon as it's toggled, separately from
// the rest of the Edit Profile form (it doesn't need the current password).
export default function PrivacySetting({ user }) {
  const [isPrivate, setIsPrivate] = useState(null); // null until loaded
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`/api/readers/${encodeURIComponent(user.username)}`)
      .then((response) => setIsPrivate(response.data.isPrivate))
      .catch(() => setError("Couldn't load your privacy setting."));
  }, [user.username]);

  const toggle = async () => {
    const next = !isPrivate;
    setError("");
    setIsPrivate(next); // show the change immediately; undo it if saving fails
    try {
      await axios.put(`/api/users/${user.id}/privacy`, { isPrivate: next });
    } catch (err) {
      setIsPrivate(!next);
      setError(err.response?.data?.message || "Failed to save. Please try again.");
    }
  };

  return (
    <section className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-gray-900" id="privacy-label">
            Private profile
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Only you can see your shelves, reviews and followers. Your username stays visible.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={Boolean(isPrivate)}
          aria-labelledby="privacy-label"
          disabled={isPrivate === null}
          onClick={toggle}
          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
            isPrivate ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isPrivate ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </section>
  );
}
