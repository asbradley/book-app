import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import ReaderProfile from "./ReaderProfile";

jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn(), delete: jest.fn() }));

const profile = (overrides) => ({
  username: "alice",
  joinedAt: "2025-03-10T00:00:00Z",
  isPrivate: false,
  isSelf: false,
  isFollowing: false,
  followerCount: 1,
  followingCount: 2,
  books: [
    { book_id: "b1", title: "Dune", author: "Frank Herbert", status: "read", rating: 5, review: "Spice!" },
    { book_id: "b2", title: "Emma", author: "Jane Austen", status: "want_to_read", rating: null, review: null },
  ],
  ...overrides,
});

const renderProfile = ({ isLoggedin = true, data = profile() } = {}) => {
  axios.get.mockResolvedValue({ data });
  return render(
    <MemoryRouter initialEntries={["/readers/alice"]}>
      <Routes>
        <Route path="/readers/:username" element={<ReaderProfile isLoggedin={isLoggedin} />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => jest.clearAllMocks());

test("shows the reader, their counts, books and reviews", async () => {
  renderProfile();

  expect(await screen.findByRole("heading", { name: "alice" })).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith("/api/readers/alice");
  expect(screen.getByText("Joined March 2025")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "1 follower" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "2 following" })).toBeInTheDocument();
  expect(screen.getByText("Dune")).toBeInTheDocument();
  expect(screen.getByText("Spice!")).toBeInTheDocument();
});

test("filters books by shelf", async () => {
  renderProfile();
  await screen.findByText("Dune");

  await userEvent.click(screen.getByRole("button", { name: "Want to Read (1)" }));

  expect(screen.queryByText("Dune")).not.toBeInTheDocument();
  expect(screen.getByText("Emma")).toBeInTheDocument();
});

test("follows and unfollows, updating the follower count", async () => {
  renderProfile();
  axios.post.mockResolvedValue({ data: { isFollowing: true, followerCount: 2 } });
  axios.delete.mockResolvedValue({ data: { isFollowing: false, followerCount: 1 } });

  const followButton = await screen.findByRole("button", { name: "Follow" });
  await act(async () => {
    await userEvent.click(followButton);
  });
  expect(axios.post).toHaveBeenCalledWith("/api/readers/alice/follow");
  expect(screen.getByRole("button", { name: "Following" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "2 followers" })).toBeInTheDocument();

  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: "Following" }));
  });
  expect(axios.delete).toHaveBeenCalledWith("/api/readers/alice/follow");
  expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
});

test("asks logged-out visitors to log in instead of showing Follow", async () => {
  renderProfile({ isLoggedin: false });

  expect(await screen.findByRole("link", { name: "Log in to follow alice" })).toHaveAttribute("href", "/login");
  expect(screen.queryByRole("button", { name: "Follow" })).not.toBeInTheDocument();
});

test("links to your own profile instead of Follow on your own page", async () => {
  renderProfile({ data: profile({ isSelf: true }) });

  expect(await screen.findByRole("link", { name: "Go to your profile" })).toHaveAttribute("href", "/profile");
});

test("shows a private notice instead of books", async () => {
  renderProfile({ data: profile({ isPrivate: true, books: null }) });

  expect(await screen.findByText("This profile is private.")).toBeInTheDocument();
  expect(screen.queryByText("Dune")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "1 follower" })).toBeDisabled();
});

test("opens the follower list", async () => {
  renderProfile();
  await screen.findByText("Dune");
  axios.get.mockResolvedValue({ data: ["bob"] });

  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: "1 follower" }));
  });

  expect(axios.get).toHaveBeenLastCalledWith("/api/readers/alice/followers");
  expect(await screen.findByRole("link", { name: "bob" })).toHaveAttribute("href", "/readers/bob");
});

test("says so when the reader doesn't exist", async () => {
  axios.get.mockRejectedValue({ response: { status: 404 } });
  render(
    <MemoryRouter initialEntries={["/readers/ghost"]}>
      <Routes>
        <Route path="/readers/:username" element={<ReaderProfile isLoggedin={false} />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByText("No reader with that username.")).toBeInTheDocument();
});
