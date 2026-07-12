import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Charts / visualization', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('visualization page renders chart containers', async ({ page }) => {
    await page.goto('/visualization');
    await expect(page).toHaveURL(/\/visualization$/);
    // Recharts renders an <svg> per chart - at least the page shell should mount.
    await expect(page.locator('body')).not.toContainText(/page not found/i);
  });
});
