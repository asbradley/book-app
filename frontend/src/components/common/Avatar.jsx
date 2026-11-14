import { useState, useEffect } from "react";
import blankAvatar from "../../assets/blank-profile.png";

// A user's profile picture, or the default silhouette when they have none (or
// it fails to load). `className` sets the size, e.g. "w-8 h-8".
export default function Avatar({ src, alt = "", className = "w-10 h-10" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <img
      src={src && !failed ? src : blankAvatar}
      alt={alt}
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover bg-gray-200 flex-shrink-0`}
    />
  );
}
