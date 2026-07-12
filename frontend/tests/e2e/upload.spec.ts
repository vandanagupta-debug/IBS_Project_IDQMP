import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Dataset upload', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('upload page renders for an authenticated user', async ({ page }) => {
    await page.goto('/upload');
    await expect(page).toHaveURL(/\/upload$/);
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });

  test('selecting a CSV file shows it as staged for upload', async ({ page }) => {
    await page.goto('/upload');
    const filePath = path.join(__dirname, 'fixtures', 'sample.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    // Scope to the upload-queue item specifically (class from FileUploader),
    // not any *.csv text elsewhere on the page - e.g. past uploads already
    // listed in "Your Datasets" from previous test/manual runs share the
    // same filename and would otherwise make this locator ambiguous.
    await expect(page.locator('.uploader-queue-name', { hasText: 'sample.csv' })).toBeVisible();
  });
});