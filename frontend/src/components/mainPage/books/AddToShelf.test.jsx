import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import AddToShelf from "./AddToShelf";

jest.mock("axios", () => ({ post: jest.fn() }));

const book = { id: "dune", title: "Dune", author: "Frank Herbert", coverImage: "http://img/dune.jpg" };

beforeEach(() => jest.clearAllMocks());

test("saves the book to the chosen shelf and confirms it", async () => {
  axios.post.mockResolvedValue({ data: {} });
  render(<AddToShelf book={book} />);

  await userEvent.selectOptions(screen.getByLabelText("Shelf"), "reading");
  await userEvent.click(screen.getByRole("button", { name: "Add to shelf" }));

  expect(axios.post).toHaveBeenCalledWith("/api/history/user-books", {
    book_id: "dune",
    title: "Dune",
    author: "Frank Herbert",
    cover_image: "http://img/dune.jpg",
    status: "reading",
  });
  expect(await screen.findByText("Added to Reading")).toBeInTheDocument();
});

test("defaults to the Want to Read shelf", async () => {
  axios.post.mockResolvedValue({ data: {} });
  render(<AddToShelf book={book} />);

  await userEvent.click(screen.getByRole("button", { name: "Add to shelf" }));

  expect(axios.post.mock.calls[0][1].status).toBe("want_to_read");
  expect(await screen.findByText("Added to Want to Read")).toBeInTheDocument();
});

test.each([
  [409, /already on your shelves/i],
  [403, /session has expired/i],
  [500, /couldn't add this book/i],
])("explains a %s response", async (status, message) => {
  axios.post.mockRejectedValue({ response: { status } });
  render(<AddToShelf book={book} />);

  await userEvent.click(screen.getByRole("button", { name: "Add to shelf" }));

  expect(await screen.findByText(message)).toBeInTheDocument();
});
