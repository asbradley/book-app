import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarRating from "./StarRating";

test("clicking a star reports that rating", async () => {
  const onChange = jest.fn();
  render(<StarRating rating={null} onChange={onChange} />);

  await userEvent.click(screen.getByLabelText("Rate 3 out of 5"));

  expect(onChange).toHaveBeenCalledWith(3);
});

test("clicking the current rating clears it", async () => {
  const onChange = jest.fn();
  render(<StarRating rating={4} onChange={onChange} />);

  await userEvent.click(screen.getByLabelText("Rate 4 out of 5"));

  expect(onChange).toHaveBeenCalledWith(null);
});

test("is display-only when no onChange is given", () => {
  render(<StarRating rating={2} />);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
});
