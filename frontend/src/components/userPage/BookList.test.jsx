import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import BookList from "./BookList";

jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() }));

const dune = {
  book_id: "dune",
  title: "Dune",
  author: "Frank Herbert",
  cover_image: null,
  status: "read",
  rating: null,
  review: null,
};
const hyperion = { ...dune, book_id: "hyperion", title: "Hyperion", author: "Dan Simmons", status: "want_to_read" };

beforeEach(() => {
  jest.clearAllMocks();
  axios.get.mockResolvedValue({ data: [dune, hyperion] });
});

const rowFor = async (title) => (await screen.findByText(title)).closest("li");

test("shows the user's books with shelf counts", async () => {
  render(<BookList userId={1} />);

  expect(await screen.findByText("Dune")).toBeInTheDocument();
  expect(screen.getByText("Hyperion")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "All (2)" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Want to Read (1)" })).toBeInTheDocument();
});

test("filters by shelf", async () => {
  render(<BookList userId={1} />);
  await screen.findByText("Dune");

  await userEvent.click(screen.getByRole("button", { name: "Want to Read (1)" }));

  expect(screen.getByText("Hyperion")).toBeInTheDocument();
  expect(screen.queryByText("Dune")).not.toBeInTheDocument();
});

test("rating a book saves it and shows the updated row", async () => {
  axios.patch.mockResolvedValue({ data: { ...dune, rating: 5 } });
  render(<BookList userId={1} />);
  const row = await rowFor("Dune");

  await userEvent.click(within(row).getByLabelText("Rate 5 out of 5"));

  expect(axios.patch).toHaveBeenCalledWith("/api/history/user-books/dune", { rating: 5 });

  // Once the saved row (rating 5) is swapped in, clicking 5 again clears it
  await waitFor(async () => {
    axios.patch.mockClear();
    await userEvent.click(within(row).getByLabelText("Rate 5 out of 5"));
    expect(axios.patch).toHaveBeenCalledWith("/api/history/user-books/dune", { rating: null });
  });
});

test("writing a review saves it and displays it", async () => {
  axios.patch.mockResolvedValue({ data: { ...dune, review: "A classic" } });
  render(<BookList userId={1} />);
  const row = await rowFor("Dune");

  await userEvent.click(within(row).getByRole("button", { name: /write review/i }));
  await userEvent.type(within(row).getByPlaceholderText("What did you think?"), "A classic");
  await userEvent.click(within(row).getByRole("button", { name: "Save" }));

  expect(axios.patch).toHaveBeenCalledWith("/api/history/user-books/dune", { review: "A classic" });
  expect(await within(row).findByText("“A classic”")).toBeInTheDocument();
});

test("removing a book takes it off the list", async () => {
  axios.delete.mockResolvedValue({});
  render(<BookList userId={1} />);
  const row = await rowFor("Dune");

  await userEvent.click(within(row).getByLabelText("Remove Dune"));

  expect(axios.delete).toHaveBeenCalledWith("/api/history/user-books/dune");
  await waitFor(() => expect(screen.queryByText("Dune")).not.toBeInTheDocument());
  expect(screen.getByText("Hyperion")).toBeInTheDocument();
});

test("shows the server's message when an update fails", async () => {
  axios.patch.mockRejectedValue({ response: { data: { message: "Invalid status" } } });
  jest.spyOn(console, "error").mockImplementation(() => {});
  render(<BookList userId={1} />);
  const row = await rowFor("Dune");

  await userEvent.selectOptions(within(row).getByRole("combobox"), "reading");

  expect(await screen.findByText("Invalid status")).toBeInTheDocument();
  console.error.mockRestore();
});

test("shows an empty state when there are no books", async () => {
  axios.get.mockResolvedValue({ data: [] });
  render(<BookList userId={1} />);

  expect(await screen.findByText(/your shelves are empty/i)).toBeInTheDocument();
});
