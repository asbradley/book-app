import axios from "axios";
import { useState } from "react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Call the API endpoint
    try {
      const response = await axios.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      // Handle successful login
      if (response.data.token) {
        
        // Add this after the successful response
        console.log("Login response:", response.data);
        console.log("Token stored:", localStorage.getItem("token"));

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setSuccess("Login Successful!");
        setFormData({ email: "", password: "" });
      }
    } catch (err) {
      // Fixed typo: err.response (not err.reponse)
      if (err.response) {
        setError(err.response.data.message || "Error occurred when logging in");
      } else {
        setError("Network error.");
      }
      console.error("Login error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Sign in to your account
        </h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Error and Success Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-xl">
            {success}
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
