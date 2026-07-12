import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Data profiling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('profiling page renders for an authenticated user', async ({ page }) => {
    await page.goto('/profiling');
    await expect(page).toHaveURL(/\/profiling$/);
    await expect(page.locator('body')).not.toContainText(/page not found/i);
  });
});
