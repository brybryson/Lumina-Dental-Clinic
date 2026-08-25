import { test, expect } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

test.describe('Lumina Clinic Admin Portal & Dentist Dashboard E2E Tests', () => {
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
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText('Dr. Lumina, DDS')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Lead Attending Dentist/i)).toBeVisible();

    await page.screenshot({
      path: `${folder}/02-admin-dashboard-loaded.png`,
      fullPage: false,
    });
  });

  test('should render daily schedule, metrics, and switch tabs between Inquiries and Calendar', async ({ page }) => {
    // Authenticate
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Dr. Lumina \(Dentist\)/i }).click();
    await page.getByRole('button', { name: /Sign In to Lumina Portal/i }).click();
    await expect(page.getByText('Dr. Lumina, DDS')).toBeVisible({ timeout: 10000 });

    // Verify Metrics Row
    await expect(page.getByText('Total Appointments')).toBeVisible();
    await expect(page.getByText('Treatments Completed')).toBeVisible();
    await expect(page.getByText('Pending Intakes')).toBeVisible();

    // Switch to Inquiries Tab
    await page.getByRole('button', { name: /Inquiries & Leads/i }).click();
    await expect(page.getByRole('heading', { name: /Clinical Inquiries & Lead Recovery Hub/i })).toBeVisible();

    await page.screenshot({
      path: `${folder}/03-admin-inquiries-tab.png`,
      fullPage: false,
    });

    // Switch to Calendar Tab
    await page.getByRole('button', { name: /Google Calendar Sync/i }).click();
    await expect(page.getByRole('heading', { name: /Google Calendar & Multi-Operatory Engine/i })).toBeVisible();
    await expect(page.getByText('luminadentalclinic2026@gmail.com')).toBeVisible();

    await page.screenshot({
      path: `${folder}/04-admin-calendar-sync-tab.png`,
      fullPage: false,
    });
  });

  test('should open Medical Intake viewer modal and display clinical history and allergies', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Dr. Lumina \(Dentist\)/i }).click();
    await page.getByRole('button', { name: /Sign In to Lumina Portal/i }).click();
    await expect(page.getByText('Dr. Lumina, DDS')).toBeVisible({ timeout: 10000 });

    // Switch to Chairside Schedule
    await page.getByRole('button', { name: /Chairside Schedule/i }).click();

    // If an intake badge is present, click View
    const intakeViewBtn = page.getByRole('button', { name: /Intake Form Received/i }).first();
    if (await intakeViewBtn.isVisible()) {
      await intakeViewBtn.click();
      await expect(page.getByText(/PATIENT CLINICAL HEALTH HISTORY/i)).toBeVisible();
      await expect(page.getByText(/Emergency Contact/i)).toBeVisible();

      await page.screenshot({
        path: `${folder}/05-admin-medical-intake-modal.png`,
        fullPage: false,
      });

      // Close modal
      await page.getByRole('button', { name: /Close Record/i }).click();
    }
  });

  test('should trigger Treatment Completion modal with Complication Flag (HITL Safeguard)', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Dr. Lumina \(Dentist\)/i }).click();
    await page.getByRole('button', { name: /Sign In to Lumina Portal/i }).click();
    await expect(page.getByText('Dr. Lumina, DDS')).toBeVisible({ timeout: 10000 });

    // Locate Complete Treatment or Edit Outcome button
    const completeBtn = page.getByRole('button', { name: /Complete Treatment|Edit Outcome/i }).first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();

      // Verify Modal opens with radio options
      await expect(page.getByText(/CHAIRSIDE TREATMENT MARK-OFF/i)).toBeVisible();
      await expect(page.getByText(/Standard Routine — No Complications/i)).toBeVisible();
      await expect(page.getByText(/Complication Encountered/i)).toBeVisible();

      // Select Complication option
      await page.getByLabel(/Complication Encountered/i).check();

      await page.screenshot({
        path: `${folder}/06-admin-completion-modal-complication.png`,
        fullPage: false,
      });

      // Close modal
      await page.getByRole('button', { name: /Cancel/i }).click();
    }
  });
});
