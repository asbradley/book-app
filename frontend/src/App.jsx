// frontend/src/App.jsx
import MainPage from "./components/mainPage/MainPage";
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 


/*
export default function App() {
  return <MainPage />;
}
*/

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
      </Routes>
    
    </BrowserRouter>
  )
}

