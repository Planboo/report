import { http, HttpResponse } from "msw";
import { DIRECTUS_URL, PROJECT_MANAGER_ROLE_ID } from "../../lib/env";

let isAdmin = true;
let currentUser = "admin@example.com";

export const handlers = [
  // Health
  http.get(`${DIRECTUS_URL}/server/ping`, () =>
    HttpResponse.json({ status: "ok" }),
  ),

  // Auth login (mock)
  http.post(`${DIRECTUS_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    // Handle specific test user
    if (body.email === "j@g.com" && body.password === "123456") {
      currentUser = "j@g.com";
      isAdmin = true; // project_manager has admin access
      return HttpResponse.json({
        data: { access_token: "mock", refresh_token: "mock" },
      });
    }

    // Default admin user
    currentUser = "admin@example.com";
    isAdmin = true;
    return HttpResponse.json({
      data: { access_token: "mock", refresh_token: "mock" },
    });
  }),

  // Current user
  http.get(`${DIRECTUS_URL}/users/me`, async ({ request }) => {
    const url = new URL(request.url);
    const fields = url.searchParams.get("fields");

    // Handle project_manager user
    if (currentUser === "j@g.com") {
      return HttpResponse.json({
        data: {
          id: "user_project_manager",
          email: "j@g.com",
          role: {
            id: PROJECT_MANAGER_ROLE_ID,
            name: "Project Manager",
            admin_access: true,
          },
        },
      });
    }

    // Check if this is the auth check request (with role fields)
    if (fields && fields.includes("role")) {
      return HttpResponse.json({
        data: {
          id: "user_1",
          email: currentUser,
          role: {
            id: isAdmin
              ? "69db487d-4b8c-433a-8f2b-ef25923d8615"
              : "regular-user-role",
            name: isAdmin ? "Admin" : "User",
            admin_access: isAdmin,
          },
        },
      });
    }

    // Default user response
    return HttpResponse.json({
      data: {
        id: "user_1",
        email: currentUser,
        role: {
          id: isAdmin
            ? "69db487d-4b8c-433a-8f2b-ef25923d8615"
            : "regular-user-role",
          name: isAdmin ? "Admin" : "User",
          admin_access: isAdmin,
        },
      },
    });
  }),

  // Policies/globals endpoint - primary admin check
  http.get(`${DIRECTUS_URL}/policies/me/globals`, () => {
    return HttpResponse.json({
      data: {
        app_access: isAdmin,
        admin_access: isAdmin,
        enforce_tfa: false,
      },
    });
  }),
];

export function __setIsAdmin(value: boolean) {
  isAdmin = value;
}

export function __setCurrentUser(email: string) {
  currentUser = email;
}
