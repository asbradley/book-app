import image from "../../assets/blank-profile.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function ProfileHeader({ user, setIsLoggedin }) {
  const avatar = user?.image || image;
  const navigate = useNavigate();

  // Conditional return: Render nothing or a loading message if user is not available
  if (!user) {
    return <p></p>; // Or null, or a skeleton loader
  }


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedin(false);
    navigate("/"); // Go back to main page
  };

  return (
    <div className="text-center">
      <img
        src={avatar}
        alt="Profile"
        className="w-24 h-24 rounded-full mx-auto"
      />
      <h2 className="text-xl font-semibold mt-2">{user.username}</h2>
      <p className="text-gray-500">{user.email}</p>
      <div className="mt-4 space-x-2">
        <Link to="/profile/edit">
          <button className="bg-gray-200 px-4 py-1 rounded">
            Edit profile
          </button>
        </Link>
        <button onClick={handleLogout} className="bg-gray-200 px-4 py-1 rounded">
          Logout
        </button>
      </div>
    </div>
  );
}
