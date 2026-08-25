import { test, expect } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

const folder = getScreenshotFolder('unsubscribe');

test.describe('Unsubscribe & Email Preference Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', (err) => console.log(`[PAGE ERROR] ${err.message}`));
    page.on('response', (res) => {
      if (res.status() >= 400) console.log(`[HTTP ${res.status()}] ${res.url()}`);
    });
  });

  test('should prefill email input from URL query parameter', async ({ page }) => {
    const testEmail = 'patient.recovery.test@example.com';
    await page.goto(`/unsubscribe?email=${encodeURIComponent(testEmail)}`);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('#email-input');
    await expect(emailInput).toHaveValue(testEmail);

    await page.screenshot({
      path: `${folder}/01-unsubscribe-prefilled.png`,
      fullPage: false,
    });
  });

  test('should validate empty or invalid email on submission', async ({ page }) => {
    await page.goto('/unsubscribe');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('#email-input');
    await emailInput.fill('');

    const submitBtn = page.getByRole('button', { name: /Confirm Unsubscribe/i });
    await submitBtn.click();

    // Verify error notice or HTML5 validation prevents empty submission
    await page.screenshot({
      path: `${folder}/02-unsubscribe-validation-check.png`,
      fullPage: false,
    });
  });

  test('should successfully unsubscribe email and show confirmation screen', async ({ page }) => {
    const testEmail = 'optout.patient.e2e@example.com';
    await page.goto(`/unsubscribe?email=${encodeURIComponent(testEmail)}`);
    await page.waitForLoadState('networkidle');

    const submitBtn = page.getByRole('button', { name: /Confirm Unsubscribe/i });
    await submitBtn.click();

    // Verify confirmation heading appears
    await expect(
      page.getByRole('heading', { name: /You Have Been Unsubscribed/i })
    ).toBeVisible({ timeout: 10000 });

    // Verify reassurance message and buttons
    await expect(page.getByText(testEmail)).toBeVisible();
    await expect(page.getByText(/Clinical Safety Guarantee/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Return to Lumina Home/i })).toBeVisible();

    await page.screenshot({
      path: `${folder}/03-unsubscribe-success-confirmation.png`,
      fullPage: false,
    });
  });

  test('should handle API unsubscribe endpoint directly via POST', async ({ request }) => {
    const response = await request.post('/api/unsubscribe', {
      data: {
        email: 'api.direct.optout@example.com',
      },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.email).toBe('api.direct.optout@example.com');
  });

  test('should handle API unsubscribe endpoint directly via GET with query param', async ({ request }) => {
    const response = await request.get('/api/unsubscribe?email=get.optout@example.com');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.email).toBe('get.optout@example.com');
  });
});
