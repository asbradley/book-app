import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import AvatarUploader from "./AvatarUploader";

jest.mock("axios", () => ({ put: jest.fn(), delete: jest.fn() }));

const user = { id: 7, username: "alice", avatarUrl: null };
const choose = async (file) => {
  await act(async () => {
    fireEvent.change(screen.getByLabelText("Upload profile picture"), { target: { files: [file] } });
  });
};

beforeEach(() => jest.clearAllMocks());

test("uploads the chosen picture and reports the new URL", async () => {
  const onChange = jest.fn();
  axios.put.mockResolvedValue({ data: { avatarUrl: "/api/readers/alice/avatar?v=1" } });
  render(<AvatarUploader user={user} onChange={onChange} />);

  await choose(new File(["img"], "me.png", { type: "image/png" }));

  const [url, body] = axios.put.mock.calls[0];
  expect(url).toBe("/api/users/7/avatar");
  expect(body.get("avatar").name).toBe("me.png");
  expect(onChange).toHaveBeenCalledWith("/api/readers/alice/avatar?v=1");
});

test("refuses files over 5 MB without uploading", async () => {
  render(<AvatarUploader user={user} onChange={jest.fn()} />);

  const big = new File(["x"], "huge.png", { type: "image/png" });
  Object.defineProperty(big, "size", { value: 5 * 1024 * 1024 + 1 });
  await choose(big);

  expect(axios.put).not.toHaveBeenCalled();
  expect(screen.getByText("Pictures must be 5 MB or smaller.")).toBeInTheDocument();
});

test("shows the server's message when an upload is refused", async () => {
  axios.put.mockRejectedValue({ response: { data: { message: "That file couldn't be read as an image" } } });
  render(<AvatarUploader user={user} onChange={jest.fn()} />);

  await choose(new File(["nope"], "fake.png", { type: "image/png" }));

  expect(screen.getByText("That file couldn't be read as an image")).toBeInTheDocument();
});

test("removes an existing picture", async () => {
  const onChange = jest.fn();
  axios.delete.mockResolvedValue({ data: { avatarUrl: null } });
  render(<AvatarUploader user={{ ...user, avatarUrl: "/a.webp" }} onChange={onChange} />);

  await act(async () => {
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
  });

  expect(axios.delete).toHaveBeenCalledWith("/api/users/7/avatar");
  expect(onChange).toHaveBeenCalledWith(null);
});

test("has no Remove button without a picture", () => {
  render(<AvatarUploader user={user} onChange={jest.fn()} />);
  expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
});
