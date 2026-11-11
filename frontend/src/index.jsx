import App from "./App";
import "./index.css";
import axios from "axios";

import { createRoot } from "react-dom/client";

// Attach the JWT (saved at login/signup) to every API request so protected
// backend routes can identify the user without the client sending its own ID.
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const root = createRoot(document.getElementById("root"));

root.render(<App />);
