export default function BookList() {
  const books = [
    {
      title: "The Vanishing Half",
      description:
        "A novel about a woman who has to choose between her life and her art.",
      image: "path/to/vanishing.jpg",
    },
    {
      title: "The Art of Living",
      description: "A guide to help you live a more joyful, fulfilling life.",
      image: "path/to/artofliving.jpg",
    },
    {
      title: "Untamed",
      description: "A memoir about the author's journey to find herself.",
      image: "path/to/untamed.jpg",
    },
  ];

  return (
    <ul className="mt-6 space-y-4">
      {books.map((book) => (
        <li key={book.title} className="flex items-start space-x-4">
          <img
            src={book.image}
            alt={book.title}
            className="w-16 h-24 object-cover"
          />
          <div>
            <h3 className="font-medium">{book.title}</h3>
            <p className="text-gray-500 text-sm">{book.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
