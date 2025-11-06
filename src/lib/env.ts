const raw = (import.meta as ImportMeta).env.VITE_DIRECTUS_URL as
  | string
  | undefined;

function normalizeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  let url = value.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/g, "");
  try {
    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}

export const DIRECTUS_URL = normalizeUrl(raw);
export const ADMIN_ROLE_ID =
  (
    (import.meta as ImportMeta).env.VITE_DIRECTUS_ADMIN_ROLE_ID as
      | string
      | undefined
  )?.trim() || "69db487d-4b8c-433a-8f2b-ef25923d8615";
export const PROJECT_MANAGER_ROLE_ID =
  (
    (import.meta as ImportMeta).env.VITE_DIRECTUS_PROJECT_MANAGER_ROLE_ID as
      | string
      | undefined
  )?.trim() || "31111be2-81e5-48a3-8746-2d53718248c6";

// Additional admin role IDs (project managers, etc.)
export const ADMIN_ROLE_IDS = [
  ADMIN_ROLE_ID, // Main admin role
  PROJECT_MANAGER_ROLE_ID, // Project Manager role
];

if (!DIRECTUS_URL) {
  console.warn(
    "VITE_DIRECTUS_URL is missing or invalid. Set it in .env.local, e.g. https://dev.planboo-mrvin.com",
  );
}
