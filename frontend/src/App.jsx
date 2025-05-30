// frontend/src/App.jsx
import MainPage from "./components/mainPage/MainPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProfileHeader from "./components/userPage/ProfileHeader";
import ProfilePage from "./components/userPage/ProfilePage";
import LoginPage from "./components/userAuthentication/LoginPage";
import CreateAccount from "./components/userAuthentication/CreateAccount";
import { useState, useEffect } from "react";

// MAIN PAGE STARTUP

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<CreateAccount />} />
      </Routes>
    
    </BrowserRouter>
  )
}
  
  



/*
// THIS IS TESTING TO JUST SEE IF LOGIN WORKS PROPERLY
export d efault function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on component mount and periodically
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      // Debug logging - remove this after testing
      console.log("Token:", token);
      console.log("User:", user);
      console.log("Is authenticated:", !!(token && user));

      setIsAuthenticated(!!(token && user));
    };

    // Check initially
    checkAuth();

    // Check every second for changes (simple polling)
    const interval = setInterval(checkAuth, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div>{isAuthenticated ? <MainPage /> : <LoginPage />}</div>
    </BrowserRouter>
  );
}
*/

/*
export default function App() {
  return (
    <ProfilePage />
  )
}
*/
