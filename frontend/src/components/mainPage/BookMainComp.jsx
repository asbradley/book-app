import BookSection from "./books/BookSection";
import data from "../../data";

export default function BookSectionMainComp() {
  const sections = [
    {
      title: "Science Fiction",
      books: data,
    },
    {
      title: "Romance",
      books: data,
    },
    {
      title: "Mystery",
      books: data,
    },
  ];

  return (
    <>
      {sections.map((section, index) => (
        <BookSection
          key={index}
          title={section.title}
          books={section.books}
        />
      ))}
    </>
  );
}
