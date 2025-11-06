import {
  createDirectus,
  rest,
  authentication,
  realtime,
  readMe,
  type DirectusClient,
  type RestClient,
  type RestCommand,
} from "@directus/sdk";
import { DIRECTUS_URL } from "./env";

if (!DIRECTUS_URL) {
  throw new Error("Missing DIRECTUS_URL");
}

type WithAuth = {
  auth: {
    token?: string;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
  };
};

export type Client = DirectusClient<Record<string, unknown>> &
  RestClient<Record<string, unknown>> &
  WithAuth & {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    subscribe: <T = Record<string, unknown>>(
      collection: string,
      options?: { event?: "create" | "update" | "delete"; query?: Record<string, unknown> },
    ) => Promise<{ subscription: AsyncIterable<T> }>;
    onWebSocket: (event: "open" | "close" | "error", handler: (data?: unknown) => void) => void;
  };

export type CurrentUser = {
  id: string;
  email: string;
  role: { id: string; name: string; admin_access?: boolean } | string;
};

export const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(authentication("json"))
  .with(realtime());

export function isAuthenticated(): boolean {
  try {
    return Boolean(directus.getToken());
  } catch {
    return false;
  }
}

export async function login(email: string, password: string) {
  await directus.login(email, password);
}

export async function logout() {
  await directus.logout();
}

export type PoliciesGlobals = {
  app_access: boolean;
  admin_access: boolean;
  enforce_tfa: boolean;
};

/**
 * Fetches user policies/globals from the Directus endpoint.
 * This is the primary way to check admin access.
 * @returns Policies globals with admin_access flag
 */
export async function fetchPoliciesGlobals(): Promise<PoliciesGlobals> {
  const token = directus.getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  // Make a custom request to the policies endpoint
  const response = await fetch(`${DIRECTUS_URL}/policies/me/globals`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch policies: ${response.statusText}`);
  }

  const data = (await response.json()) as { data: PoliciesGlobals };
  return data.data;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const fields = [
    "id",
    "email",
    { role: ["id", "name", "admin_access"] },
  ] as const;
  // Narrow SDK typing using an explicit RestCommand and minimal eslint escape hatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = readMe({ fields } as any) as RestCommand<
    unknown,
    Record<string, unknown>
  >;
  const raw = (await directus.request(query)) as unknown;
  const response = raw as Record<string, unknown>;
  const obj = (response["data"] as Record<string, unknown>) || response;
  const roleRaw = obj["role"];

  let role: CurrentUser["role"];
  if (
    typeof roleRaw === "object" &&
    roleRaw !== null &&
    "id" in (roleRaw as Record<string, unknown>)
  ) {
    const rr = roleRaw as Record<string, unknown>;
    role = {
      id: String(rr["id"] ?? ""),
      name: String(rr["name"] ?? ""),
      admin_access:
        typeof rr["admin_access"] === "boolean"
          ? (rr["admin_access"] as boolean)
          : undefined,
    };
  } else {
    role = String(roleRaw ?? "");
  }

  return {
    id: String(obj["id"] ?? ""),
    email: String(obj["email"] ?? ""),
    role,
  };
}
