import { test, expect, Page } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

async function loginAsDentist(page: Page) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Dr. Lumina \(Dentist\)/i }).click();
  await page.getByRole('button', { name: /Sign In to Lumina Portal/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Dr. Lumina')).toBeVisible({ timeout: 15000 });
}

test.describe('Lumina Clinic Admin Portal & Interactive Calendar E2E Tests', () => {
  const folder = getScreenshotFolder('admin');

  test('should validate staff login, reject invalid credentials, and authenticate Dr. Lumina', async ({ page }) => {
    // 1. Navigate to Admin Login
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Dentist & Staff Login/i })).toBeVisible();

    // 2. Test Invalid Password
    await page.locator('#admin-email').fill('doctor@luminaclinic.com');
    await page.locator('#admin-password').fill('WrongPassword123!');
    await page.getByRole('button', { name: /Sign In to Lumina Portal/i }).click();

    await expect(page.getByText(/Invalid clinical credentials/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${folder}/01-admin-login-invalid-check.png`,
      fullPage: false,
    });

    // 3. Test Successful Login using preset
    await page.getByRole('button', { name: /Dr. Lumina \(Dentist\)/i }).click();
    await page.getByRole('button', { name: /Sign In to Lumina Portal/i }).click();

    // Verify redirected to /admin dashboard
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await expect(page.getByText('Dr. Lumina')).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: `${folder}/02-admin-dashboard-loaded.png`,
      fullPage: false,
    });
  });

  test('should render daily schedule, metrics, and filter appointments', async ({ page }) => {
    await loginAsDentist(page);

    // Verify Metrics Row
    await expect(page.getByText(/TOTAL VISITS/i)).toBeVisible();
    await expect(page.getByText('COMPLETED', { exact: true })).toBeVisible();
    await expect(page.getByText(/INTAKES PENDING/i)).toBeVisible();

    // Test Date Filter
    await page.getByRole('button', { name: /Today \(Aug 25\)/i }).click();
    await page.getByRole('button', { name: /All Visits/i }).click();

    await page.screenshot({
      path: `${folder}/03-admin-schedule-filtered.png`,
      fullPage: false,
    });
  });

  test('should navigate Interactive Studio Calendar with Philippine Holidays and day modal', async ({ page }) => {
    await loginAsDentist(page);

    // Switch to Clinic Calendar Tab
    await page.getByRole('button', { name: /Studio Calendar & PH Holidays/i }).click();
    await expect(page.getByText('August 2026')).toBeVisible();

    // Verify Philippine Holidays rendered
    await expect(page.getByText(/Ninoy Aquino Day/i)).toBeVisible();
    await expect(page.getByText(/National Heroes Day/i)).toBeVisible();

    await page.screenshot({
      path: `${folder}/04-admin-calendar-month-holidays.png`,
      fullPage: false,
    });

    // Month navigation: Click Next Month (September) then Prev Month
    await page.getByLabel('Next Month').click();
    await expect(page.getByText('September 2026')).toBeVisible();
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await expect(page.getByText('August 2026')).toBeVisible();

    // Click a day cell to open Day Schedule Modal
    const dayCell = page.locator('div[class*="rounded-2xl"]:has-text("28")').first();
    if (await dayCell.isVisible()) {
      await dayCell.click();
      await expect(page.getByText(/DAILY CLINICAL SCHEDULE/i)).toBeVisible();

      await page.screenshot({
        path: `${folder}/05-admin-calendar-day-modal.png`,
        fullPage: false,
      });

      await page.getByRole('button', { name: /Close/i }).click();
    }
  });

  test('should open Medical Intake modal and Treatment Completion modal', async ({ page }) => {
    await loginAsDentist(page);

    // Switch to Chairside Schedule
    await page.getByRole('button', { name: /Chairside Schedule/i }).click();

    // If an intake badge is present, click View
    const intakeViewBtn = page.getByRole('button', { name: /Intake Form/i }).first();
    if (await intakeViewBtn.isVisible()) {
      await intakeViewBtn.click();
      await expect(page.getByText(/PATIENT MEDICAL HEALTH RECORD/i)).toBeVisible();
      await expect(page.getByText(/Emergency Contact/i)).toBeVisible();

      await page.screenshot({
        path: `${folder}/06-admin-medical-intake-modal.png`,
        fullPage: false,
      });

      await page.getByRole('button', { name: /Close Record/i }).click();
    }

    // Locate Complete Visit or Edit Outcome button
    const completeBtn = page.getByRole('button', { name: /Complete Visit|Edit Outcome/i }).first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();

      // Verify Modal opens with simplified text options (no emojis)
      await expect(page.getByText(/CHAIRSIDE TREATMENT MARK-OFF/i)).toBeVisible();
      await expect(page.getByText(/Standard Visit — Normal Recovery/i)).toBeVisible();
      await expect(page.getByText(/Complication Encountered/i)).toBeVisible();

      // Select Complication option
      await page.getByLabel(/Complication Encountered/i).check();

      await page.screenshot({
        path: `${folder}/07-admin-completion-modal-polished.png`,
        fullPage: false,
      });

      // Close modal
      await page.getByRole('button', { name: /Cancel/i }).click();
    }
  });
});
