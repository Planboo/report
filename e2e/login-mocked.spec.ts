import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Clear any existing authentication state
  await page.context().clearCookies();
  await page.context().clearPermissions();
});

test('login flow with mocked Directus', async ({ page }) => {
  // Mock initial auth check to return 401 (unauthenticated)
  await page.route('**/users/me*', async route => {
    if (route.request().url().includes('fields=id%2Cemail%2Crole')) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Unauthorized' }] })
      });
    }
  });

  // Mock successful login
  await page.route('**/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token'
        }
      })
    });
  });

  // Navigate to the app root
  await page.goto('/');
  
  // Should redirect to login page
  await expect(page).toHaveURL('/login');
  
  // Fill in the login form
  await page.fill('input[type="email"]', 'admin@prod.com');
  await page.fill('input[type="password"]', '123456');
  
  // Update mock for after login (admin user)
  await page.route('**/users/me*', async route => {
    if (route.request().url().includes('fields=id%2Cemail%2Crole')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'user-1',
            email: 'admin@prod.com',
            role: {
              id: '69db487d-4b8c-433a-8f2b-ef25923d8615',
              name: 'Admin',
              admin_access: true
            }
          }
        })
      });
    }
  });
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Should redirect to photos page after successful login
  await expect(page).toHaveURL('/photos');
  
  // Should see the Photo Review heading
  await expect(page.locator('h1')).toContainText('Photo Review');
  
  // Should see logout button in nav
  await expect(page.locator('button:has-text("Logout")')).toBeVisible();
});

test('login with invalid credentials shows error (mocked)', async ({ page }) => {
  // Mock failed login
  await page.route('**/auth/login', async route => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        errors: [{ message: 'Invalid credentials' }]
      })
    });
  });

  await page.goto('/login');
  
  // Fill in invalid credentials
  await page.fill('input[type="email"]', 'invalid@example.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Should show error message
  await expect(page.locator('text=Login failed')).toBeVisible();
  
  // Should stay on login page
  await expect(page).toHaveURL('/login');
});

test('non-admin user redirected to home page', async ({ page }) => {
  // Set up all mocks before navigation
  await page.route('**/users/me*', async route => {
    // First call (initial auth check) - return 401
    if (route.request().url().includes('fields=id%2Cemail%2Crole')) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Unauthorized' }] })
      });
    }
  });

  await page.route('**/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token'
        }
      })
    });
  });

  // Navigate to login page directly
  await page.goto('/login');
  
  // Should be on login page
  await expect(page).toHaveURL('/login');
  
  // Fill in credentials
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password');
  
  // Update the mock for after login
  await page.route('**/users/me*', async route => {
    if (route.request().url().includes('fields=id%2Cemail%2Crole')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'user-2',
            email: 'user@example.com',
            role: {
              id: 'regular-user-role',
              name: 'User',
              admin_access: false
            }
          }
        })
      });
    }
  });
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Should redirect to home page for non-admin users
  await expect(page).toHaveURL('/home');
  
  // Should see the home page content
  await expect(page.locator('h1')).toContainText('Welcome to Photo Review System');
  
  // Should see limited access message
  await expect(page.locator('text=Limited Access')).toBeVisible();
});
