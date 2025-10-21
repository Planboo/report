import { createDirectus, rest, authentication, readMe, type DirectusClient, type RestClient, type RestCommand } from '@directus/sdk';
import { DIRECTUS_URL } from './env';

if (!DIRECTUS_URL) {
  throw new Error('Missing DIRECTUS_URL');
}

type WithAuth = {
  auth: {
    token?: string;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
  };
};

export type Client = DirectusClient<Record<string, unknown>> & RestClient<Record<string, unknown>> & WithAuth;

export type CurrentUser = {
  id: string;
  email: string;
  role: { id: string; name: string; admin_access?: boolean } | string;
};

export const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(authentication('json'))

export function isAuthenticated(): boolean {
  try {
    return Boolean(directus.getToken());
  } catch {
    return false;
  }
}

export async function login(email: string, password: string) {
  await directus.login( email, password );
}

export async function logout() {
  await directus.logout();
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const fields = ['id', 'email', { role: ['id', 'name', 'admin_access'] }] as const;
  // Narrow SDK typing using an explicit RestCommand and minimal eslint escape hatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = readMe({ fields } as any) as RestCommand<unknown, Record<string, unknown>>;
  const raw = (await directus.request(query)) as unknown;
  const obj = raw as Record<string, unknown>;
  const roleRaw = obj['role'];
  let role: CurrentUser['role'];
  if (typeof roleRaw === 'object' && roleRaw !== null && 'id' in (roleRaw as Record<string, unknown>)) {
    const rr = roleRaw as Record<string, unknown>;
    role = {
      id: String(rr['id'] ?? ''),
      name: String(rr['name'] ?? ''),
      admin_access: typeof rr['admin_access'] === 'boolean' ? (rr['admin_access'] as boolean) : undefined,
    };
  } else {
    role = String(roleRaw ?? '');
  }
  return {
    id: String(obj['id'] ?? ''),
    email: String(obj['email'] ?? ''),
    role,
  };
}
