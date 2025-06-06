import { useState } from "react";
import { useNavigate } from "react-router-dom";
import image from "../../assets/blank-profile.png";
import axios from "axios";



export default function EditProfile({ user, onSave }) {
  const [avatar, setAvatar] = useState(user?.image || image);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword) {
       setError("Please enter your current password to update your profile.");
       return;
     }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        username,
        email,
        oldPassword,
        password: newPassword ? newPassword : undefined, // Only send if changed
      };

      // Remove undefined fields
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      const response = await axios.put(
        `/api/users/${user.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Profile updated!");
      setError("");
      onSave(response.data.user);

      // Update localStorage so user stays in sync after refresh
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update profile. Please try again."
      );
      setSuccess("");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-2xl font-semibold mb-4 text-center">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="flex space-x-6">
        {/* Left side: Avatar */}
        <div className="flex-shrink-0 flex flex-col items-center space-y-3">
          <img src={avatar} alt="Profile" className="w-24 h-24 rounded-full" />
          <button className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition" type="button">
            Edit Avatar
          </button>
        </div>

        {/* Right side: Input fields */}
        <div className="flex-grow space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Old Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Old Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>
        </div>
      </form>
      <div className="text-center mt-6">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          onClick={handleSubmit}
        >
          Save Changes
        </button>
        {error && <div className="mt-4 text-red-600">{error}</div>}
        {success && <div className="mt-4 text-green-600">{success}</div>}
      </div>
    </div>
  );
}
