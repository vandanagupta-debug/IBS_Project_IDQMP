import { test, expect, devices } from '@playwright/test';

test.describe('Responsive layout', () => {
  test('login page adapts to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    // No horizontal scrollbar on small screens.
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test('login page adapts to desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
