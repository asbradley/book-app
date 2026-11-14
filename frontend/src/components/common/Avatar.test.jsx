import { render, screen, fireEvent } from "@testing-library/react";
import Avatar from "./Avatar";

test("shows the picture, falling back to the default if it fails to load", () => {
  render(<Avatar src="/api/readers/alice/avatar?v=1" alt="alice" />);
  const img = screen.getByAltText("alice");
  expect(img).toHaveAttribute("src", "/api/readers/alice/avatar?v=1");

  fireEvent.error(img);

  expect(img.getAttribute("src")).not.toContain("/api/readers");
});

test("uses the default picture when there is none", () => {
  render(<Avatar src={null} alt="nobody" />);
  expect(screen.getByAltText("nobody")).toHaveAttribute("src", "blank-profile.png");
});
