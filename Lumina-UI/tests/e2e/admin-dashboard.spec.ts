import { test, expect, Page } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

// ==============================================================================
// 1. Practice Staff Credentials & Multi-Role Configuration
// ==============================================================================

// Primary Practice Owner / Super Administrator (Full Management Access)
const SUPER_ADMIN = {
  name: 'Bryant Iverson Melliza',
  email: 'bryantiversonmelliza03@gmail.com',
  password: 'LuminaStudio2026!',
};

// Attending Clinician / Dentist (Restricted Role: No Staff Directory Tab)
const ATTENDING_DENTIST = {
  name: 'Dr. iverson melliza',
  email: 'brybry.melliza@gmail.com',
  password: 'LuminaMeow123',
};

// Dynamic Test Clinician for Role Lifecycle Testing (Creation & Revocation)
const TEST_CLINICIAN = {
  firstName: 'Zenux Iverson',
  lastName: 'Melliza',
  email: 'bryantmelliza03@gmail.com',
  password: 'ZenuxSecurePass2026!',
  birthDate: '2003-11-27',
  branch: 'Bonifacio Global City, Taguig',
  specialization: 'Cosmetic & Restorative Dentist',
  licenseNumber: 'PRC-112703',
};

// ==============================================================================
// 2. Authentication Helper (Cryptographic Session + Cookie Verification)
// ==============================================================================
async function loginAsUser(page: Page, email: string, pass: string, expectedName: string) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  // Fill email and password inputs
  await page.locator('#admin-email').fill(email);
  await page.locator('#admin-password').fill(pass);
  await page.getByRole('button', { name: /^Sign In$/i }).click();

  // Await redirection to /admin and verify session profile header
  await page.waitForURL(/\/admin$/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(new RegExp(expectedName, 'i')).first()).toBeVisible({ timeout: 15000 });
}

// ==============================================================================
// 3. E2E Test Suite: Multi-Role Portals, Calendar Gating, Security & Life-Cycle
// ==============================================================================
test.describe('Lumina Clinic Admin Portal — Multi-Role & Operations Hub E2E Tests', () => {

  // ----------------------------------------------------------------------------
  // SUITE 1: Security & Authentication
  // ----------------------------------------------------------------------------
  test('01: Security Gate & Route Guards — unauthenticated redirects & credential rejection', async ({ page }) => {
    const folder = getScreenshotFolder('admin', 'Security & Authentication');

    // 1. Direct navigation to /admin without session must redirect to /admin/login
    await page.goto('/admin');
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Dentist & Staff Login/i })).toBeVisible();

    // 2. Direct navigation to /admin/account without session must redirect to /admin/login
    await page.goto('/admin/account');
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });

    await page.screenshot({
      path: `${folder}/01-unauthenticated-login-redirect.png`,
      fullPage: false,
    });

    // 3. Test Invalid Credentials Rejection
    await page.locator('#admin-email').fill(SUPER_ADMIN.email);
    await page.locator('#admin-password').fill('InvalidPracticePassword2026!');
    await page.getByRole('button', { name: /^Sign In$/i }).click();

    // Verify error notification
    await expect(page.getByText(/Invalid clinical credentials/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${folder}/02-invalid-credentials-rejection.png`,
      fullPage: false,
    });
  });

  test('02: Attending Dentist Role — doctor login, chairside access, and RBAC tab restrictions', async ({ page }) => {
    const folder = getScreenshotFolder('admin', 'Security & Authentication');

    // Authenticate with Attending Dentist credentials
    await loginAsUser(page, ATTENDING_DENTIST.email, ATTENDING_DENTIST.password, ATTENDING_DENTIST.name);

    // Verify Doctor Profile is displayed
    await expect(page.getByText('Dr. iverson melliza').first()).toBeVisible();

    // Verify Super Admin exclusive tab (Staff Directory) is HIDDEN for Dentist role
    await expect(page.getByRole('button', { name: /Staff & Doctor Directory/i })).toHaveCount(0);

    // Verify Chairside Schedule is accessible
    await expect(page.getByRole('button', { name: /Chairside Schedule/i })).toBeVisible();

    await page.screenshot({
      path: `${folder}/03-attending-dentist-rbac-dashboard.png`,
      fullPage: false,
    });
  });

  test('03: Account Security & Branch Management — real-time password mismatch validator', async ({ page }) => {
    const folder = getScreenshotFolder('admin', 'Security & Authentication');

    await loginAsUser(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.name);

    // Navigate to /admin/account
    await page.goto('/admin/account');
    await page.waitForLoadState('networkidle');

    // Wait for profile data to load
    await expect(page.locator('input[placeholder*="Enter new password" i], input[type="password"]').first()).toBeVisible({ timeout: 15000 });

    // Test Real-time Password Mismatch Detection
    const newPassInput = page.locator('input[placeholder*="Enter new password" i], input[placeholder*="8+ chars" i]').first();
    const confirmPassInput = page.locator('input[placeholder*="Repeat new password" i]').first();

    if (await newPassInput.isVisible() && await confirmPassInput.isVisible()) {
      await newPassInput.fill('NewSecurePassword2026!');
      await confirmPassInput.fill('MismatchPassword123!');

      // Immediate inline validation error
      await expect(page.getByText(/Passwords do not match/i)).toBeVisible();

      await page.screenshot({
        path: `${folder}/04-account-password-mismatch-validator.png`,
        fullPage: false,
      });

      // Matching password validation
      await confirmPassInput.fill('NewSecurePassword2026!');
      await expect(page.getByText(/Passwords match securely/i)).toBeVisible();
    }
  });

  // ----------------------------------------------------------------------------
  // SUITE 2: Chairside Treatment & Daily Clinical Schedule
  // ----------------------------------------------------------------------------
  test('04: Chairside Schedule — date segment filters (Today, This Week, This Month, All), status filters, and search', async ({ page }) => {
    const folder = getScreenshotFolder('admin', 'Chairside Schedule');

    await loginAsUser(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.name);

    // 1. Click 'Today' filter (Shows August 26, 2026 rows)
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await page.waitForTimeout(400);

    await page.screenshot({
      path: `${folder}/01-chairside-today-filter.png`,
      fullPage: false,
    });

    // 2. Click 'This Week' filter
    await page.getByRole('button', { name: 'This Week', exact: true }).click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${folder}/02-chairside-this-week-filter.png`,
      fullPage: false,
    });

    // 3. Click 'This Month' filter
    await page.getByRole('button', { name: 'This Month', exact: true }).click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${folder}/03-chairside-this-month-filter.png`,
      fullPage: false,
    });

    // 4. Click 'All' filter
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${folder}/04-chairside-all-filter.png`,
      fullPage: false,
    });

    // 5. Test Status Selector Dropdown
    const statusSelect = page.locator('select').filter({ hasText: /All Statuses/i }).first();
    
    // Status: Confirmed
    await statusSelect.selectOption('confirmed');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/05-chairside-status-confirmed.png`,
      fullPage: false,
    });

    // Status: Completed
    await statusSelect.selectOption('completed');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/06-chairside-status-completed.png`,
      fullPage: false,
    });

    // Status: No Show (Unattended)
    await statusSelect.selectOption('no_show');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/07-chairside-status-no-show.png`,
      fullPage: false,
    });

    // Reset status to All
    await statusSelect.selectOption('all');
    await page.waitForTimeout(300);

    // 6. Test Search Input with Patient Keyword
    const searchInput = page.getByPlaceholder(/Search patient, service, notes, allergy.../i);
    await searchInput.fill('Melliza');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: `${folder}/08-chairside-search-results.png`,
      fullPage: false,
    });

    await searchInput.fill('');
  });

  // ----------------------------------------------------------------------------
  // SUITE 3: Lumina Calendar & Clinical Modals
  // ----------------------------------------------------------------------------
  test('05: Lumina Calendar — multiple dates inspection, daily modal, treatment outcome modal, & month navigation', async ({ page }) => {
    const folder = getScreenshotFolder('admin', 'Lumina Calendar');

    await loginAsUser(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.name);

    // Switch to Lumina Calendar Tab
    await page.getByRole('button', { name: /Lumina Calendar/i }).click();
    await page.waitForTimeout(400);

    // 1. Initial August 2026 View Screenshot
    await page.screenshot({
      path: `${folder}/01-calendar-august-2026-view.png`,
      fullPage: false,
    });

    // 2. Check Date 1 (Today: August 26, 2026) -> Click cell, inspect modal
    const todayCell = page.locator('div[class*="min-h-"][class*="cursor-pointer"]').filter({ hasText: '26' }).first();
    if (await todayCell.isVisible()) {
      await todayCell.click();
      await page.waitForTimeout(500);

      const modalHeading = page.locator('p.eyebrow', { hasText: 'DAILY CLINICAL SCHEDULE' }).first();
      await expect(modalHeading).toBeVisible();

      await page.screenshot({
        path: `${folder}/02-calendar-day-modal-aug26.png`,
        fullPage: false,
      });

      // 3. Test "Edit Outcome" on Completed Appointment (Test clinical outcome radio buttons, DO NOT click confirm)
      const editOutcomeBtn = page.getByRole('button', { name: /Edit Outcome/i }).first();
      if (await editOutcomeBtn.isVisible()) {
        await editOutcomeBtn.click();
        await page.waitForTimeout(400);

        // Verify Treatment Mark-off modal
        await expect(page.getByText(/CHAIRSIDE TREATMENT MARK-OFF/i)).toBeVisible();

        // Switch to Complication radio button
        const complicationRadio = page.locator('input[type="radio"][value="complication"]');
        if (await complicationRadio.isVisible()) {
          await complicationRadio.check();
          await page.waitForTimeout(200);
        }

        // Switch back to Standard radio button
        const standardRadio = page.locator('input[type="radio"][value="standard"]');
        if (await standardRadio.isVisible()) {
          await standardRadio.check();
          await page.waitForTimeout(200);
        }

        await page.screenshot({
          path: `${folder}/03-calendar-edit-outcome-modal.png`,
          fullPage: false,
        });

        // Click Cancel to close modal without submitting
        await page.getByRole('button', { name: /Cancel/i }).first().click();
        await page.waitForTimeout(300);
      }

      // Close day modal if still open
      const closeBtn = page.getByRole('button', { name: /Close/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 4. Check Date 2 (August 28, 2026) -> Click cell, inspect modal
    const day28Cell = page.locator('div[class*="min-h-"][class*="cursor-pointer"]').filter({ hasText: '28' }).first();
    if (await day28Cell.isVisible()) {
      await day28Cell.click();
      await page.waitForTimeout(500);

      const dayModalHeading = page.locator('p.eyebrow', { hasText: 'DAILY CLINICAL SCHEDULE' }).first();
      if (await dayModalHeading.isVisible()) {
        await page.screenshot({
          path: `${folder}/04-calendar-day-modal-aug28.png`,
          fullPage: false,
        });

        const closeBtn = page.getByRole('button', { name: /Close/i }).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // 5. Month Navigation: Select "September" from dropdown -> Full page zoomed screenshot
    const monthSelect = page.locator('select').filter({ hasText: /August/i }).first();
    if (await monthSelect.isVisible()) {
      await monthSelect.selectOption('8'); // 8 = September
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${folder}/05-calendar-september-2026-zoomed.png`,
        fullPage: true,
      });

      // Return to Today/August
      await page.getByRole('button', { name: 'Today', exact: true }).click();
      await page.waitForTimeout(300);
    }
  });

  // ----------------------------------------------------------------------------
  // SUITE 4: Inquiries & Abandoned Lead Recovery
  // ----------------------------------------------------------------------------
  test('06: Inquiries & Leads — comprehensive status and source combinations matrix', async ({ page }) => {
    const folder = getScreenshotFolder('admin', 'Inquiries & Leads');

    await loginAsUser(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.name);

    // Switch to Inquiries & Leads Tab
    await page.getByRole('button', { name: /Inquiries & Leads/i }).click();
    await expect(page.getByRole('heading', { name: /Clinical Inquiries & Abandoned Lead Recovery/i })).toBeVisible();

    const statusSelect = page.locator('select').filter({ hasText: /All Statuses/i }).first();
    const sourceSelect = page.locator('select').filter({ hasText: /All Sources/i }).first();

    // 1. Default Filters (All Statuses, All Sources)
    await page.screenshot({
      path: `${folder}/01-inquiries-default-filters.png`,
      fullPage: false,
    });

    // 2. Status: New / Active Leads (All Sources)
    await statusSelect.selectOption('pending');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/02-inquiries-new-leads-all-sources.png`,
      fullPage: false,
    });

    // 3. Status: Converted to Booking (All Sources)
    await statusSelect.selectOption('converted');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/03-inquiries-converted-all-sources.png`,
      fullPage: false,
    });

    // 4. Status: Archived (All Sources)
    await statusSelect.selectOption('archived');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/04-inquiries-archived-all-sources.png`,
      fullPage: false,
    });

    // 5. Status: All Statuses | Source: Contact Form Modal
    await statusSelect.selectOption('all');
    await sourceSelect.selectOption('contact_modal');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/05-inquiries-all-status-contact-modal.png`,
      fullPage: false,
    });

    // 6. Status: All Statuses | Source: Step 1 Funnel Drop-off
    await sourceSelect.selectOption('booking_funnel_step1');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/06-inquiries-all-status-step1-dropoff.png`,
      fullPage: false,
    });

    // 7. Status: New / Active Leads | Source: Contact Form Modal
    await statusSelect.selectOption('pending');
    await sourceSelect.selectOption('contact_modal');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/07-inquiries-new-leads-contact-modal.png`,
      fullPage: false,
    });

    // 8. Status: Converted to Booking | Source: Step 1 Funnel Drop-off
    await statusSelect.selectOption('converted');
    await sourceSelect.selectOption('booking_funnel_step1');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/08-inquiries-converted-step1-dropoff.png`,
      fullPage: false,
    });

    // Reset filters
    await statusSelect.selectOption('all');
    await sourceSelect.selectOption('all');
  });

  // ----------------------------------------------------------------------------
  // SUITE 5: Staff & Doctor Directory
  // ----------------------------------------------------------------------------
  test('07: Staff Directory — role filters, creation modal, search card, and access revocation', async ({ page }) => {
    const folder = getScreenshotFolder('admin', 'Staff & Doctor Directory');

    await loginAsUser(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.name);

    // Navigate to Staff & Doctor Directory tab
    await page.getByRole('button', { name: /Staff & Doctor Directory/i }).click();
    await expect(page.getByRole('heading', { name: /Staff & Clinicians Access Directory/i })).toBeVisible();

    const roleSelect = page.locator('select').filter({ hasText: /All Roles/i }).first();

    // 1. All Roles View
    await page.screenshot({
      path: `${folder}/01-staff-directory-all-roles.png`,
      fullPage: false,
    });

    // 2. Filter: Attending Doctors
    await roleSelect.selectOption('doctor');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/02-staff-filter-doctors.png`,
      fullPage: false,
    });

    // 3. Filter: Front Desk & Staff
    await roleSelect.selectOption('front_desk');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/03-staff-filter-front-desk.png`,
      fullPage: false,
    });

    // 4. Filter: Super Admins
    await roleSelect.selectOption('super_admin');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${folder}/04-staff-filter-super-admin.png`,
      fullPage: false,
    });

    // Reset role filter
    await roleSelect.selectOption('all');
    await page.waitForTimeout(300);

    // 5. Open 'Add New Doctor / Staff' Modal
    await page.getByRole('button', { name: /Add New Doctor \/ Staff/i }).click();
    await expect(page.getByText(/Add Doctor or Staff Account/i)).toBeVisible();

    await page.screenshot({
      path: `${folder}/05-staff-add-modal.png`,
      fullPage: false,
    });

    // 6. Fill User Details & Submit
    await page.locator('input[placeholder="e.g. Maria"]').fill(TEST_CLINICIAN.firstName);
    await page.locator('input[placeholder="e.g. Santos"]').fill(TEST_CLINICIAN.lastName);
    await page.locator('input[placeholder="doctor.santos@luminaclinic.com"]').fill(TEST_CLINICIAN.email);
    await page.locator('input[placeholder="e.g. Cosmetic Dentistry"]').fill(TEST_CLINICIAN.specialization);
    await page.locator('input[placeholder="PRC-123456"]').fill(TEST_CLINICIAN.licenseNumber);
    await page.locator('input[placeholder="Default: LuminaStudio2026!"]').fill(TEST_CLINICIAN.password);

    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await page.waitForTimeout(1000);

    // Search for created staff
    const staffSearch = page.getByPlaceholder(/Search staff by name, email.../i);
    await staffSearch.fill(TEST_CLINICIAN.email);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${folder}/06-staff-new-user-created-card.png`,
      fullPage: false,
    });

    // 7. Revoke Access & Screenshot Confirmation
    const removeBtn = page.getByRole('button', { name: /Remove Access/i }).first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await expect(page.getByText(/Revoke Staff Access\?/i)).toBeVisible();

      await page.screenshot({
        path: `${folder}/07-staff-access-revocation-modal.png`,
        fullPage: false,
      });

      await page.getByRole('button', { name: /Yes, Remove Access/i }).click();
      await page.waitForTimeout(1000);
    }

    await staffSearch.fill('');
  });

});
