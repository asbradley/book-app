import { useRef, useState } from "react";
import axios from "axios";
import Avatar from "../common/Avatar";

const MAX_BYTES = 5 * 1024 * 1024;

// Profile picture with Change/Remove buttons. Uploads as soon as a file is
// chosen (the server resizes it) and calls onChange with the new avatarUrl.
export default function AvatarUploader({ user, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // so choosing the same file again still triggers a change
    if (!file) return;

    // Checked by the server too; this just saves uploading a file that will be refused
    if (file.size > MAX_BYTES) {
      setError("Pictures must be 5 MB or smaller.");
      return;
    }

    const form = new FormData();
    form.append("avatar", file);
    await save(() => axios.put(`/api/users/${user.id}/avatar`, form));
  };

  const save = async (request) => {
    setBusy(true);
    setError("");
    try {
      const response = await request();
      onChange(response.data.avatarUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Avatar src={user.avatarUrl} alt="Your profile picture" className="w-24 h-24" />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
        aria-label="Upload profile picture"
      />
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        disabled={busy}
        className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition disabled:opacity-60"
      >
        {busy ? "Saving..." : "Change picture"}
      </button>
      {user.avatarUrl && (
        <button
          type="button"
          onClick={() => save(() => axios.delete(`/api/users/${user.id}/avatar`))}
          disabled={busy}
          className="text-sm text-gray-500 hover:text-red-600"
        >
          Remove
        </button>
      )}
      {error && <p className="text-sm text-red-600 text-center max-w-[10rem]">{error}</p>}
    </div>
  );
}
