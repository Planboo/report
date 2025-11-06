import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "../msw/server";
import { cleanup } from "@testing-library/react";

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));

// Reset handlers and cleanup DOM between tests
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close the server when tests finish
afterAll(() => server.close());
