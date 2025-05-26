import { useState } from 'react';
import axios from 'axios'

export default function CreateAccount() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }
    
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
  
      setSuccess('Account created successfully! Please check your email to verify your account.');
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      // Optionally redirect to login page
      // window.location.href = '/signin';
      
    } catch (err) {
      if (err.response) {
        // Server responded with a status other than 2xx
        setError(err.response.data.message || 'An error occurred while creating your account');
      } else {
        // Network error or other issue
        setError('Network error. Please try again.');
      }
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create your account
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-xl">
            {success}
          </div>
        )}
        
        <div className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <a href="/signin" className="text-blue-600 hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}