import { render, screen } from "@testing-library/react";
import axios from "axios";
import ReviewList from "./ReviewList";

jest.mock("axios", () => ({ get: jest.fn() }));

const book = (overrides) => ({
  book_id: "x",
  title: "Untitled",
  author: "Someone",
  cover_image: null,
  rating: null,
  review: null,
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

test("lists only reviewed books, most recently updated first", async () => {
  axios.get.mockResolvedValue({
    data: [
      book({ book_id: "a", title: "Older", review: "Good", updated_at: "2026-01-01T00:00:00Z" }),
      book({ book_id: "b", title: "Unreviewed" }),
      book({ book_id: "c", title: "Newer", review: "Great", updated_at: "2026-03-01T00:00:00Z" }),
    ],
  });
  render(<ReviewList userId={1} />);

  const titles = (await screen.findAllByRole("heading")).map((h) => h.textContent);
  expect(titles).toEqual(["Newer", "Older"]);
  expect(screen.queryByText("Unreviewed")).not.toBeInTheDocument();
});

test("shows an empty state when nothing has been reviewed", async () => {
  axios.get.mockResolvedValue({ data: [book({})] });
  render(<ReviewList userId={1} />);

  expect(await screen.findByText(/no reviews yet/i)).toBeInTheDocument();
});
