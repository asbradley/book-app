import BookshelfNavbar from "./Header";
import BookshelfSidebar from "./sideBar/SideBar";
import RightPanel from "./RightPanel";

export default function MainPage() {
  return (
    <div className="flex flex-col h-screen">
      <BookshelfNavbar />
      <div className="flex flex-1">
        <BookshelfSidebar />
        <RightPanel />
      </div>
    </div>
  );
}
