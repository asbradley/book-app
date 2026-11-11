import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import BookResults from "./BookResults";

jest.mock("axios", () => ({ get: jest.fn() }));

const renderResults = (props) =>
  render(
    <MemoryRouter>
      <BookResults title="Results" emptyMessage="Nothing here." fetchUrl="/api/x" {...props} />
    </MemoryRouter>
  );

beforeEach(() => jest.clearAllMocks());

test("shows an error message instead of crashing when the request fails", async () => {
  // Previously this rendered the Error object itself, which crashed React
  axios.get.mockRejectedValue(new Error("Network Error"));
  jest.spyOn(console, "error").mockImplementation(() => {});
  renderResults();

  expect(await screen.findByText("Failed to load books.")).toBeInTheDocument();
  console.error.mockRestore();
});

test("shows the empty message when there are no books", async () => {
  axios.get.mockResolvedValue({ data: [] });
  renderResults();

  expect(await screen.findByText("Nothing here.")).toBeInTheDocument();
});

test("ignores a slow response for a previous URL", async () => {
  // The first request resolves after the second, like a slow network
  let resolveFirst;
  axios.get
    .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
    .mockResolvedValueOnce({ data: [{ id: "new", title: "New result", author: "A" }] });

  const { rerender } = renderResults({ fetchUrl: "/api/old" });
  rerender(
    <MemoryRouter>
      <BookResults title="Results" emptyMessage="Nothing here." fetchUrl="/api/new" />
    </MemoryRouter>
  );
  expect(await screen.findByText("New result")).toBeInTheDocument();

  await act(async () => resolveFirst({ data: [{ id: "old", title: "Old result", author: "B" }] }));

  expect(screen.getByText("New result")).toBeInTheDocument();
  expect(screen.queryByText("Old result")).not.toBeInTheDocument();
});
