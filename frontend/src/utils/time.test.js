import { timeAgo, monthYear } from "./time";

const now = new Date("2026-06-15T12:00:00Z").getTime();
const ago = (seconds) => new Date(now - seconds * 1000);

test.each([
  [10, "just now"],
  [5 * 60, "5 minutes ago"],
  [3 * 60 * 60, "3 hours ago"],
  [24 * 60 * 60, "yesterday"],
  [14 * 24 * 60 * 60, "2 weeks ago"],
  [400 * 24 * 60 * 60, "last year"],
])("%i seconds ago reads as %p", (seconds, expected) => {
  expect(timeAgo(ago(seconds), now)).toBe(expected);
});

test("monthYear", () => {
  expect(monthYear("2025-03-10T12:00:00Z")).toBe("March 2025");
});
