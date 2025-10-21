import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Clear any existing authentication state
  await page.context().clearCookies();
  await page.context().clearPermissions();
  
  // Navigate to a clean state
  await page.goto('/');
  
  // Clear any stored authentication data
  await page.evaluate(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });
});

test('login flow with admin credentials', async ({ page }) => {
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });

  // Navigate to the app
  await page.goto('/');
  
  // Should redirect to login page
  await expect(page).toHaveURL('/login');
  
  // Fill in the login form
  await page.fill('input[type="email"]', 'jessica@planboo.eco');
  await page.fill('input[type="password"]', 'Z#^B^##Twc3+.ge#SMmasf8\\');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait a bit for the login to process
  await page.waitForTimeout(2000);
  
  // Check if there's an error message
  const errorElement = page.locator('text=Login failed');
  if (await errorElement.isVisible()) {
    const errorText = await errorElement.textContent();
    console.log('Login error:', errorText);
  }
  
  // Should redirect to home page (since user is not admin)
  await expect(page).toHaveURL('/home');
  
  // Should see the home page content
  await expect(page.locator('h1')).toContainText('Welcome to Photo Review System');
});

test('login with invalid credentials shows error', async ({ page }) => {
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
