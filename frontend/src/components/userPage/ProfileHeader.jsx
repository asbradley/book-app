import image from "../../assets/blank-profile.png";

export default function ProfileHeader({ user }) {
  const avatar = user?.image || image ;

  // Conditional return: Render nothing or a loading message if user is not available
  if (!user) {
    return <p></p>; // Or null, or a skeleton loader
  }

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
        <button className="bg-gray-200 px-4 py-1 rounded">Edit profile</button>
      </div>
    </div>
  );
}
