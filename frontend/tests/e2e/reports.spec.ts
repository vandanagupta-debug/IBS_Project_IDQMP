import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('reports page renders for an authenticated user', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL(/\/reports$/);
    await expect(page.locator('body')).not.toContainText(/page not found/i);
  });
});
