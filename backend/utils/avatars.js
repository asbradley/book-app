// Profile pictures: validating, resizing and addressing them.
//
// Uploads are decoded and re-encoded with sharp, which both shrinks them to a
// fixed small size and guarantees what we store is a real image (anything
// that isn't fails to decode). Only the re-encoded WebP is kept, so metadata
// such as camera GPS location in the original photo is discarded.

const sharp = require("sharp");

const AVATAR_SIZE = 256; // pixels, square
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Resolves to a square WebP buffer; rejects if the input isn't a decodable image
function processAvatar(buffer) {
  return sharp(buffer, { limitInputPixels: 40_000_000 }) // ~40 MP, guards against decompression bombs
    .rotate() // respect the photo's EXIF orientation
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
    .webp({ quality: 80 })
    .toBuffer();
}

// Public URL for a user's avatar, or null when they haven't uploaded one.
// The ?v= changes whenever the picture does, so browsers can cache each
// version indefinitely and still see a new upload straight away.
function avatarUrl(username, avatarUpdatedAt) {
  if (!avatarUpdatedAt) return null;
  return `/api/readers/${encodeURIComponent(username)}/avatar?v=${new Date(avatarUpdatedAt).getTime()}`;
}

module.exports = { processAvatar, avatarUrl, MAX_UPLOAD_BYTES, ACCEPTED_TYPES, AVATAR_SIZE };
