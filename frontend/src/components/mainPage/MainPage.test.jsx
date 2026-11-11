// Search flow through the real MainPage: header -> URL -> results -> modal
import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import MainPage from "./MainPage";

jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));

const homeBook = { id: "home1", title: "Home Page Book", author: "A", genre: "Fantasy" };
const dune = {
  id: "dune",
  title: "Dune",
  author: "Frank Herbert",
  coverImage: null,
  description: "A desert planet",
  link: "",
};

beforeEach(() => {
  jest.clearAllMocks();
  axios.get.mockImplementation(async (url) => {
    if (url.startsWith("/api/books/search")) return { data: [dune] };
    return { data: [homeBook] }; // home page sections
  });
});

const renderPage = ({ isLoggedin = false, url = "/" } = {}) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MainPage isLoggedin={isLoggedin} />
    </MemoryRouter>
  );

// user-event v13 doesn't wait for React, so wrap typing in act() to let the
// requests it triggers settle inside the test
const search = async (text) => {
  const box = screen.getByRole("searchbox", { name: "Search books" });
  await act(async () => {
    await userEvent.type(box, `${text}{enter}`);
  });
};

test("searching shows matching books", async () => {
  renderPage();
  await screen.findByText("Home Page Book");

  await search("dune");

  expect(await screen.findByText('Results for "dune"')).toBeInTheDocument();
  expect(screen.getByText("Dune")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith("/api/books/search?q=dune");
});

test("loads results straight from a shared ?q= link", async () => {
  renderPage({ url: "/?q=dune" });

  expect(await screen.findByText('Results for "dune"')).toBeInTheDocument();
  expect(screen.getByRole("searchbox", { name: "Search books" })).toHaveValue("dune");
});

test("clearing the search returns to the home page", async () => {
  renderPage({ url: "/?q=dune" });
  await screen.findByText('Results for "dune"');

  await act(async () => {
    await userEvent.click(screen.getByLabelText("Clear search"));
  });

  expect(await screen.findByText("Home Page Book")).toBeInTheDocument();
  expect(screen.queryByText('Results for "dune"')).not.toBeInTheDocument();
});

test("logged-in users can add a search result to a shelf", async () => {
  axios.post.mockResolvedValue({ data: {} });
  renderPage({ isLoggedin: true, url: "/?q=dune" });

  await userEvent.click(await screen.findByText("Dune"));
  const modal = screen.getByText("A desert planet").closest("div.relative");
  await userEvent.click(within(modal).getByRole("button", { name: "Add to shelf" }));

  expect(axios.post).toHaveBeenCalledWith(
    "/api/history/user-books",
    expect.objectContaining({ book_id: "dune", status: "want_to_read" })
  );
  expect(await within(modal).findByText("Added to Want to Read")).toBeInTheDocument();
});

test("logged-out users are prompted to log in instead", async () => {
  renderPage({ url: "/?q=dune" });

  await userEvent.click(await screen.findByText("Dune"));

  expect(screen.getByRole("link", { name: /log in to add this book/i })).toHaveAttribute("href", "/login");
  expect(screen.queryByRole("button", { name: "Add to shelf" })).not.toBeInTheDocument();
});
