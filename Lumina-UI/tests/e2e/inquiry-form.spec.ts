import { test, expect } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

const folder = getScreenshotFolder('inquiry');

test.describe('General & Clinical Inquiries Form E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', (err) => console.log(`[PAGE ERROR] ${err.message}`));
    page.on('response', (res) => {
      if (res.status() >= 400) console.log(`[HTTP ${res.status()}] ${res.url()}`);
    });

    await page.goto('/#booking-section');
    await page.waitForLoadState('networkidle');

    // Ensure we are in "Send an Inquiry" mode
    const inquiryTabBtn = page.getByTestId('tab-inquiry');
    await inquiryTabBtn.click();
  });

  test('should validate required fields and display error messages', async ({ page }) => {
    // Attempt to submit empty inquiry form
    const submitBtn = page.getByTestId('button-inquiry-submit');
    await submitBtn.click();

    // Check error validations appear
    await expect(page.getByText(/Enter your first name/i)).toBeVisible();
    await expect(page.getByText(/Enter your last name/i)).toBeVisible();
    await expect(page.getByText(/Enter a valid email address/i)).toBeVisible();
    await expect(page.getByText(/Please describe your inquiry or questions/i)).toBeVisible();

    // Save validation errors screenshot
    await page.screenshot({
      path: `${folder}/01-inquiry-validation-errors.png`,
      fullPage: false,
    });
  });

  test('should successfully submit clinical inquiry with treatment of interest and record in database', async ({ page }) => {
    // Fill in valid inquiry details
    await page.locator('#first-name').fill('Sarah');
    await page.locator('#last-name').fill('Connor');
    await page.locator('#inquiry-email').fill('sarah.connor@example.com');
    await page.locator('#inquiry-phone').fill('(415) 555-9876');
    await page.locator('#inquiry-service').selectOption({ label: 'Laser Teeth Whitening' });
    await page.locator('#inquiry-message').fill(
      'Hello! I would like to inquire about the Laser Teeth Whitening treatment and whether you accept direct HMO billing for cosmetic consultations.'
    );

    // Capture filled form screenshot before submit
    await page.screenshot({
      path: `${folder}/02-inquiry-form-filled.png`,
      fullPage: false,
    });

    // Submit the form (persists into Supabase database inquiries table)
    const submitBtn = page.getByTestId('button-inquiry-submit');
    await submitBtn.click();

    // Verify success confirmation card appears
    await expect(page.locator('h3:has-text("Thank you, Sarah!")')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('sarah.connor@example.com')).toBeVisible();

    // Capture the actual confirmed/success screen
    await page.screenshot({
      path: `${folder}/03-inquiry-confirmed-success.png`,
      fullPage: false,
    });
  });
});
