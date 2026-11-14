import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Feed from "./Feed";

jest.mock("axios", () => ({ get: jest.fn() }));

const item = (overrides) => ({
  username: "alice",
  book_id: "b1",
  title: "Dune",
  author: "Frank Herbert",
  cover_image: null,
  status: "read",
  rating: null,
  review: null,
  activity_at: new Date().toISOString(),
  ...overrides,
});

const renderFeed = () =>
  render(
    <MemoryRouter>
      <Feed />
    </MemoryRouter>
  );

beforeEach(() => jest.clearAllMocks());

test("describes each reader's activity and links to their profile", async () => {
  axios.get.mockResolvedValue({
    data: {
      items: [
        item({ rating: 4, review: "Loved it" }),
        item({ username: "bob", book_id: "b2", title: "Emma", author: "Jane Austen", status: "reading" }),
      ],
      nextCursor: null,
    },
  });

  renderFeed();

  expect(await screen.findByText("finished")).toBeInTheDocument();
  expect(screen.getByText("is reading")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute("href", "/readers/alice");
  expect(screen.getByText("Loved it")).toBeInTheDocument();
  expect(screen.getByLabelText("Rated 4 out of 5")).toBeInTheDocument();
  expect(screen.getAllByText("just now")).toHaveLength(2);
  expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
});

test("loads the next page with the cursor", async () => {
  axios.get
    .mockResolvedValueOnce({ data: { items: [item()], nextCursor: "123_4" } })
    .mockResolvedValueOnce({ data: { items: [item({ book_id: "b2", title: "Emma" })], nextCursor: null } });

  renderFeed();
  const loadMore = await screen.findByRole("button", { name: "Load more" });
  await act(async () => {
    await userEvent.click(loadMore);
  });

  expect(axios.get).toHaveBeenLastCalledWith("/api/feed", { params: { cursor: "123_4" } });
  expect(screen.getByText("Dune")).toBeInTheDocument();
  expect(screen.getByText("Emma")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
});

test("suggests finding readers when the feed is empty", async () => {
  axios.get.mockResolvedValue({ data: { items: [], nextCursor: null } });

  renderFeed();

  expect(await screen.findByText(/find readers above and follow them/i)).toBeInTheDocument();
  expect(screen.getByRole("searchbox", { name: "Find readers" })).toBeInTheDocument();
});

test("searches for readers", async () => {
  axios.get.mockResolvedValue({ data: { items: [], nextCursor: null } });
  renderFeed();
  await screen.findByText(/find readers above/i);
  axios.get.mockResolvedValue({ data: ["bookworm"] });

  await act(async () => {
    await userEvent.type(screen.getByRole("searchbox", { name: "Find readers" }), "book{enter}");
  });

  expect(axios.get).toHaveBeenLastCalledWith("/api/readers/search", { params: { q: "book" } });
  expect(screen.getByRole("link", { name: "bookworm" })).toHaveAttribute("href", "/readers/bookworm");
});
