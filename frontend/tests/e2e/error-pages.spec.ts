import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Error pages', () => {
  test('unknown route shows a not-found page', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByText(/page not found/i)).toBeVisible();
  });
});
