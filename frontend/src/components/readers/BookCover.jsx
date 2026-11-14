// Small book cover with a gray placeholder when there's no image
export default function BookCover({ src, title, className = "w-12 h-[72px]" }) {
  return src ? (
    <img src={src} alt={title} className={`${className} object-cover rounded-md flex-shrink-0`} />
  ) : (
    <div className={`${className} bg-gray-100 rounded-md flex-shrink-0`} aria-hidden="true" />
  );
}
