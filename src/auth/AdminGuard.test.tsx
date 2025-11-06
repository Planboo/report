import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderWithProviders, screen } from "../test/test-utils";
import AdminGuard from "./AdminGuard";
import { server } from "../test/msw/server";
import { http, HttpResponse } from "msw";
import { DIRECTUS_URL } from "../lib/env";

describe("AdminGuard", () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("renders children when admin_access=true", async () => {
    // Mock authentication token
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => "mock-token",
        setItem: () => {},
        removeItem: () => {},
      },
      writable: true,
    });

    // Mock admin user and policies
    server.use(
      http.get(`${DIRECTUS_URL}/users/me`, () =>
        HttpResponse.json({
          data: {
            id: "user_1",
            email: "admin@example.com",
            role: { id: "admin_role", name: "Admin", admin_access: true },
          },
        }),
      ),
      http.get(`${DIRECTUS_URL}/policies/me/globals`, () =>
        HttpResponse.json({
          data: {
            app_access: true,
            admin_access: true,
            enforce_tfa: false,
          },
        }),
      ),
    );

    renderWithProviders(
      <AdminGuard fallback={<div>nope</div>}>
        <div>ok</div>
      </AdminGuard>,
    );
    expect(await screen.findByText("ok")).toBeInTheDocument();
  });

  it("renders fallback when admin_access=false", async () => {
    server.use(
      http.get(`${DIRECTUS_URL}/users/me`, () =>
        HttpResponse.json({
          data: {
            id: "user_2",
            email: "user@example.com",
            role: { id: "role_2", name: "Editor", admin_access: false },
          },
        }),
      ),
      http.get(`${DIRECTUS_URL}/policies/me/globals`, () =>
        HttpResponse.json({
          data: {
            app_access: true,
            admin_access: false,
            enforce_tfa: false,
          },
        }),
      ),
    );

    renderWithProviders(
      <AdminGuard fallback={<div>nope</div>}>
        <div>ok</div>
      </AdminGuard>,
    );
    expect(await screen.findByText("nope")).toBeInTheDocument();
  });
});
