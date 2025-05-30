import BookshelfNavbar from "./Header";
import BookshelfSidebar from "./sideBar/SideBar";
import RightPanel from "./RightPanel";
import Footer from "./Footer";
import { useState } from "react";

export default function MainPage({ isLoggedin }) {
  const [selectedGenre, setSelectedGenre] = useState("None");

  return (
    <div className="flex flex-col min-h-screen">

      {/* Pass state to navBar as this is where buttons/info is shown */} 
      <BookshelfNavbar isLoggedin={isLoggedin}/>

      <div className="flex flex-1">
        <BookshelfSidebar onGenreSelect={setSelectedGenre} />
        <RightPanel selectedGenre={selectedGenre} />
      </div>

      <Footer />
    </div>
  );
}
