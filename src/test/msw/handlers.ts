import { http, HttpResponse } from 'msw';
import { DIRECTUS_URL } from '../../lib/env';

let isAdmin = true;

export const handlers = [
  // Health
  http.get(`${DIRECTUS_URL}/server/ping`, () => HttpResponse.json({ status: 'ok' })),

  // Auth login (mock)
  http.post(`${DIRECTUS_URL}/auth/login`, async () => {
    return HttpResponse.json({ data: { access_token: 'mock', refresh_token: 'mock' } });
  }),

  // Current user
  http.get(`${DIRECTUS_URL}/users/me`, async ({ request }) => {
    const url = new URL(request.url);
    const fields = url.searchParams.get('fields');
    
    // Check if this is the auth check request (with role fields)
    if (fields && fields.includes('role')) {
      return HttpResponse.json({
        data: {
          id: 'user_1',
          email: 'admin@example.com',
          role: { 
            id: isAdmin ? '69db487d-4b8c-433a-8f2b-ef25923d8615' : 'regular-user-role', 
            name: isAdmin ? 'Admin' : 'User', 
            admin_access: isAdmin 
          }
        }
      });
    }
    
    // Default user response
    return HttpResponse.json({
      data: {
        id: 'user_1',
        email: 'admin@example.com',
        role: { 
          id: isAdmin ? '69db487d-4b8c-433a-8f2b-ef25923d8615' : 'regular-user-role', 
          name: isAdmin ? 'Admin' : 'User', 
          admin_access: isAdmin 
        }
      }
    });
  }),
];

export function __setIsAdmin(value: boolean) {
  isAdmin = value;
}
