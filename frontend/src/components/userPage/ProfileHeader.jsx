export default function ProfileHeader() {
  return (
    <div className="text-center">
      <img
        src="path/to/avatar.jpg"
        alt="Profile"
        className="w-24 h-24 rounded-full mx-auto"
      />
      <h2 className="text-xl font-semibold mt-2">Emma Li</h2>
      <p className="text-gray-500">Product designer @ Facebook</p>
      <div className="mt-4 space-x-2">
        <button className="bg-gray-200 px-4 py-1 rounded">Edit profile</button>
      </div>
    </div>
  );
}
