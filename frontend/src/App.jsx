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
  
  const [isLoggedin, setisLoggedin] = useState(false);
  const [user, setUser] = useState(null)

  // Checks localStorage
  useEffect(() => {
    const storedStatus = localStorage.getItem("isLoggedin")
    const storedUser = localStorage.getItem("user")
    if (storedStatus === "true" && storedUser) {
      setisLoggedin(true)
      setUser(JSON.parse(storedUser))
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage isLoggedin={isLoggedin}/>} />
        <Route path="/login" element={<LoginPage setisLoggedin={setisLoggedin}/>} />
        <Route path="/signup" element={<CreateAccount setisLoggedin={setisLoggedin}/>} />
        <Route path="/profile" element={<ProfilePage user={user}/>} />
      </Routes>
    
    </BrowserRouter>
  )
}