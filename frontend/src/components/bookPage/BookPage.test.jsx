import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import BookPage from "./BookPage";
import BookModal from "../mainPage/books/BookDetailed";

jest.mock("axios", () => ({ get: jest.fn() }));

const noReviews = { readerCount: 0, ratingCount: 0, averageRating: null, reviews: [] };

const dune = {
  id: "dune1",
  title: "Dune",
  author: "Frank Herbert",
  authors: ["Frank Herbert"],
  coverImage: "http://img/dune.jpg",
  description: "A desert planet.\n\nSpice.",
  link: "http://books/dune1",
  publishedDate: "1965",
  pageCount: 412,
  categories: ["Fiction"],
};

// The book itself, or its community reviews, depending on the URL
const mockApi = (book) =>
  axios.get.mockImplementation((url) =>
    url.endsWith("/reviews") ? Promise.resolve({ data: noReviews }) : book
  );

const renderPage = (path = "/books/dune1") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/books/:bookId" element={<BookPage isLoggedin={false} />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  document.title = "Bookshelf";
});

test("loads the book from the URL and shows its details", async () => {
  mockApi(Promise.resolve({ data: dune }));

  renderPage();

  expect(await screen.findByRole("heading", { level: 1, name: "Dune" })).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith("/api/books/dune1");
  expect(screen.getByText("by Frank Herbert")).toBeInTheDocument();
  expect(screen.getByText("Published 1965")).toBeInTheDocument();
  expect(screen.getByText("412 pages")).toBeInTheDocument();
  expect(screen.getByText("Fiction")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View on Google Books" })).toHaveAttribute("href", "http://books/dune1");
  expect(screen.getByRole("link", { name: /log in to add/i })).toBeInTheDocument();
  expect(document.title).toBe("Dune | Bookshelf");
  expect(await screen.findByText(/no readers have shelved this book yet/i)).toBeInTheDocument();
});

test("says when the book doesn't exist", async () => {
  mockApi(Promise.reject({ response: { status: 404 } }));

  renderPage("/books/missing");

  expect(await screen.findByText("We couldn't find that book.")).toBeInTheDocument();
  expect(document.title).toBe("Bookshelf");
});

test("the popup links to the book's page", async () => {
  mockApi(Promise.resolve({ data: dune }));

  render(
    <MemoryRouter>
      <BookModal book={{ ...dune, id: "a b" }} onClose={() => {}} />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "Open book page" })).toHaveAttribute("href", "/books/a%20b");
  expect(await screen.findByText(/no readers have shelved this book yet/i)).toBeInTheDocument();
});
