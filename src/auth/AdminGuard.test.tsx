import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '../test/test-utils';
import AdminGuard from './AdminGuard';
import { server } from '../test/msw/server';
import { http, HttpResponse } from 'msw';
import { DIRECTUS_URL } from '../lib/env';

describe('AdminGuard', () => {
  it('renders children when admin_access=true', async () => {
    renderWithProviders(
      <AdminGuard fallback={<div>nope</div>}>
        <div>ok</div>
      </AdminGuard>
    );
    expect(await screen.findByText('ok')).toBeInTheDocument();
  });

  it('renders fallback when admin_access=false', async () => {
    server.use(
      http.get(`${DIRECTUS_URL}/users/me`, () =>
        HttpResponse.json({
          data: {
            id: 'user_2',
            email: 'user@example.com',
            role: { id: 'role_2', name: 'Editor', admin_access: false },
          },
        })
      )
    );

    renderWithProviders(
      <AdminGuard fallback={<div>nope</div>}>
        <div>ok</div>
      </AdminGuard>
    );
    expect(await screen.findByText('nope')).toBeInTheDocument();
  });
});

