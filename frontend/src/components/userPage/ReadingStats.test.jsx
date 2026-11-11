import { render, screen, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import ReadingStats from "./ReadingStats";

jest.mock("axios", () => ({ get: jest.fn(), put: jest.fn() }));

const emptyStats = {
  year: 2026,
  shelves: { want_to_read: 0, reading: 0, read: 0 },
  readThisYear: 0,
  monthly: Array(12).fill(0),
  ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  ratedCount: 0,
  averageRating: null,
  topAuthors: [],
  goal: null,
};

const busyStats = {
  ...emptyStats,
  shelves: { want_to_read: 4, reading: 2, read: 9 },
  readThisYear: 6,
  monthly: [1, 0, 3, 0, 0, 0, 2, 0, 0, 0, 0, 0],
  ratings: { 1: 0, 2: 1, 3: 0, 4: 2, 5: 3 },
  ratedCount: 6,
  averageRating: 4.2,
  topAuthors: [{ author: "Ursula K. Le Guin", count: 3 }],
  goal: 12,
};

const renderStats = async (stats) => {
  axios.get.mockResolvedValue({ data: stats });
  render(<ReadingStats />);
  await screen.findByText(`Read in ${stats.year}`);
};

beforeEach(() => jest.clearAllMocks());

test("shows headline numbers", async () => {
  await renderStats(busyStats);

  const tile = (label) => screen.getByText(label).parentElement;
  expect(tile("Read in 2026")).toHaveTextContent("6");
  expect(tile("Reading now")).toHaveTextContent("2");
  expect(tile("Want to read")).toHaveTextContent("4");
  expect(tile("Average rating")).toHaveTextContent("4.2from 6 ratings");
});

test("shows progress toward the yearly goal", async () => {
  await renderStats(busyStats);

  const meter = screen.getByRole("meter", { name: "2026 reading goal" });
  expect(meter).toHaveAttribute("aria-valuetext", "6 of 12 books (50%)");
});

test("lets the user set a goal", async () => {
  await renderStats(emptyStats);
  axios.put.mockResolvedValue({ data: { year: 2026, goal: 20 } });

  await userEvent.click(screen.getByRole("button", { name: "Set a goal" }));
  await userEvent.type(screen.getByLabelText("Books to read in 2026:"), "20");
  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
  });

  expect(axios.put).toHaveBeenCalledWith("/api/history/goal", { target: 20 });
  expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "0 of 20 books (0%)");
});

test("shows the server's message when a goal is rejected", async () => {
  await renderStats(emptyStats);
  axios.put.mockRejectedValue({ response: { data: { message: "Goal must be a whole number from 1 to 1000" } } });

  await userEvent.click(screen.getByRole("button", { name: "Set a goal" }));
  await userEvent.type(screen.getByLabelText("Books to read in 2026:"), "5000");
  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
  });

  expect(screen.getByText("Goal must be a whole number from 1 to 1000")).toBeInTheDocument();
});

test("charts books per month with an accessible label and hover tooltip per month", async () => {
  await renderStats(busyStats);

  const march = screen.getByRole("img", { name: "March: 3 books" });
  expect(screen.getByRole("img", { name: "February: 0 books" })).toBeInTheDocument();

  expect(within(march).queryByText("3 books")).not.toBeInTheDocument();
  userEvent.hover(march);
  expect(await within(march).findByText("3 books")).toBeInTheDocument();
  userEvent.unhover(march);
  expect(within(march).queryByText("3 books")).not.toBeInTheDocument();
});

test("offers the monthly numbers as a table", async () => {
  await renderStats(busyStats);

  const rows = screen.getAllByRole("row", { hidden: true });
  expect(rows).toHaveLength(13); // header + 12 months
  expect(rows[3]).toHaveTextContent("March3");
});

test("labels each rating bar with its count", async () => {
  await renderStats(busyStats);

  expect(screen.getByLabelText("5 stars: 3 books (50%)")).toBeInTheDocument();
  expect(screen.getByLabelText("1 star: 0 books (0%)")).toBeInTheDocument();
  expect(screen.getByText("Ursula K. Le Guin")).toBeInTheDocument();
});

test("shows empty states for a new reader", async () => {
  await renderStats(emptyStats);

  expect(screen.getByText("No goal set for 2026.")).toBeInTheDocument();
  expect(screen.getByText("No books finished yet this year.")).toBeInTheDocument();
  expect(screen.getByText(/rate some books/i)).toBeInTheDocument();
  expect(screen.getByText(/finish a few books/i)).toBeInTheDocument();
});
