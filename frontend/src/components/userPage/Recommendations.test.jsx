import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import Recommendations from "./Recommendations";

jest.mock("axios", () => ({ get: jest.fn() }));

const wind = {
  id: "wind",
  title: "The Name of the Wind",
  author: "Patrick Rothfuss",
  coverImage: null,
  description: "A legend's story",
  link: "",
  reason: "Because you loved Dune's world-building",
};

beforeEach(() => jest.clearAllMocks());

test("shows each recommendation with the AI's reason", async () => {
  axios.get.mockResolvedValue({ data: { recommendations: [wind] } });
  render(<Recommendations userId={1} />);

  expect(await screen.findByText("The Name of the Wind")).toBeInTheDocument();
  expect(screen.getByText("Because you loved Dune's world-building")).toBeInTheDocument();
});

test("clicking a recommendation opens its details", async () => {
  axios.get.mockResolvedValue({ data: { recommendations: [wind] } });
  render(<Recommendations userId={1} />);

  await userEvent.click(await screen.findByText("The Name of the Wind"));

  expect(screen.getByText("A legend's story")).toBeInTheDocument();
});

test("'New picks' asks the server for a fresh set", async () => {
  axios.get.mockResolvedValue({ data: { recommendations: [wind] } });
  render(<Recommendations userId={1} />);
  await screen.findByText("The Name of the Wind");

  await userEvent.click(screen.getByRole("button", { name: /new picks/i }));

  expect(axios.get).toHaveBeenLastCalledWith("/api/history/recommendations", {
    params: { refresh: true },
  });
  // Let the refreshed list render before the test ends
  expect(await screen.findByText("The Name of the Wind")).toBeInTheDocument();
});

test("shows a helpful message when there's nothing to recommend yet", async () => {
  axios.get.mockResolvedValue({ data: { recommendations: [] } });
  render(<Recommendations userId={1} />);

  expect(await screen.findByText(/add a few books/i)).toBeInTheDocument();
});

test("shows the server's error message", async () => {
  axios.get.mockRejectedValue({
    response: { data: { message: "Recommendations are temporarily unavailable." } },
  });
  jest.spyOn(console, "error").mockImplementation(() => {});
  render(<Recommendations userId={1} />);

  expect(await screen.findByText("Recommendations are temporarily unavailable.")).toBeInTheDocument();
  console.error.mockRestore();
});
