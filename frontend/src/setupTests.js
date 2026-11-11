// Runs before each frontend test file (picked up automatically by react-scripts).
// Adds DOM matchers like toBeInTheDocument().
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// React Router v7 uses TextEncoder, which the jsdom version bundled with
// Create React App doesn't provide, so borrow Node's.
Object.assign(global, { TextEncoder, TextDecoder });
