import { test, expect } from '@playwright/test';

test.describe('Homepage / Login', () => {
  test('unauthenticated users land on the login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DataForge/i);

    // The left marketing panel (with this heading) is hidden on narrow/mobile
    // viewports by design - only assert it on wider layouts where it renders.
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 768) {
      await expect(page.getByRole('heading', { name: /trusted decisions/i })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: /sign in to your workspace/i })).toBeVisible();
  });

  test('login form is present and usable', async ({ page }) => {
    await page.goto('/');
    // Use the input IDs directly - getByLabel(/password/i) also matches the
    // "Toggle password visibility" button, since its aria-label contains
    // "Password" too.
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('unauthenticated visits to protected routes redirect to login', async ({ page }) => {
    await page.goto('/upload');
    await expect(page).toHaveURL('/');
  });
});