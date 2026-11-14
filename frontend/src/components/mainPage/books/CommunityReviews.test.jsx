import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import CommunityReviews from "./CommunityReviews";

jest.mock("axios", () => ({ get: jest.fn() }));

const renderReviews = () =>
  render(
    <MemoryRouter>
      <CommunityReviews bookId="dune id" />
    </MemoryRouter>
  );

beforeEach(() => jest.clearAllMocks());

test("shows the average rating, reader count and reviews linked to profiles", async () => {
  axios.get.mockResolvedValue({
    data: {
      readerCount: 3,
      ratingCount: 2,
      averageRating: 4.5,
      reviews: [{ username: "alice", rating: 5, review: "Masterpiece", updated_at: new Date().toISOString() }],
    },
  });

  renderReviews();

  expect(await screen.findByText("4.5")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith("/api/books/dune%20id/reviews");
  expect(screen.getByText("from 2 ratings ·")).toBeInTheDocument();
  expect(screen.getByText("3 readers have this on their shelves")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute("href", "/readers/alice");
  expect(screen.getByText("Masterpiece")).toBeInTheDocument();
  expect(screen.getByLabelText("Rated 5 out of 5")).toBeInTheDocument();
});

test("says when nobody has shelved the book", async () => {
  axios.get.mockResolvedValue({
    data: { readerCount: 0, ratingCount: 0, averageRating: null, reviews: [] },
  });

  renderReviews();

  expect(await screen.findByText("No readers have shelved this book yet.")).toBeInTheDocument();
});

test("uses the singular for one reader", async () => {
  axios.get.mockResolvedValue({
    data: { readerCount: 1, ratingCount: 0, averageRating: null, reviews: [] },
  });

  renderReviews();

  expect(await screen.findByText("1 reader has this on their shelves")).toBeInTheDocument();
});

test("handles a failed request quietly", async () => {
  axios.get.mockRejectedValue(new Error("down"));

  renderReviews();

  expect(await screen.findByText("Reader reviews couldn't be loaded.")).toBeInTheDocument();
});
