// frontend/src/App.jsx
import MainPage from "./components/mainPage/MainPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProfilePage from "./components/userPage/ProfilePage";
import LoginPage from "./components/userAuthentication/LoginPage";
import CreateAccount from "./components/userAuthentication/CreateAccount";
import { useState } from "react";
import EditProfile from "./components/userPage/EditProfile";
import ReaderProfile from "./components/readers/ReaderProfile";

// Returns the logged-in user saved by LoginPage/CreateAccount, or null.
// Clears the saved login if it's missing pieces or can't be parsed.
function readStoredUser() {
  try {
    if (localStorage.getItem("isLoggedin") === "true") {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) return user;
    }
  } catch (error) {
    console.error("Error parsing stored user data:", error);
  }
  localStorage.removeItem("isLoggedin");
  localStorage.removeItem("user");
  return null;
}

export default function App() {
  // Restore the saved login before the first render, so pages opened directly
  // or refreshed (e.g. /profile/edit) get the user right away instead of
  // rendering once with no user
  const [user, setUser] = useState(readStoredUser);
  const [isLoggedin, setisLoggedin] = useState(() => user !== null);

  // Clears every piece of auth state (storage + React state) in one place
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedin");
    setisLoggedin(false);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage isLoggedin={isLoggedin} user={user} />} />
        <Route
          path="/login"
          element={
            <LoginPage setisLoggedin={setisLoggedin} setUser={setUser} />
          }
        />
        <Route
          path="/signup"
          element={
            <CreateAccount setisLoggedin={setisLoggedin} setUser={setUser} />
          }
        />
        <Route path="/readers/:username" element={<ReaderProfile isLoggedin={isLoggedin} user={user} />} />
        <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />

        <Route
          path="/profile/edit"
          element={
            <EditProfile
              user={user}
              onSave={(updatedUser) => {
                setUser(updatedUser); // Updated state with new user
              }}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
