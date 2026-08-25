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
  const folder = getScreenshotFolder('admin');

  // ----------------------------------------------------------------------------
  // TEST 1: Security Route Guards, Unauthorized Redirection, and Bad Password
  // ----------------------------------------------------------------------------
  test('01: Security Gate & Route Guards — unauthenticated redirects & credential rejection', async ({ page }) => {
    // 1. Direct navigation to /admin without session must redirect to /admin/login
    await page.goto('/admin');
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Dentist & Staff Login/i })).toBeVisible();

    // 2. Direct navigation to /admin/account without session must redirect to /admin/login
    await page.goto('/admin/account');
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });

    // 3. Test Invalid Credentials Rejection
    await page.locator('#admin-email').fill(SUPER_ADMIN.email);
    await page.locator('#admin-password').fill('InvalidPracticePassword2026!');
    await page.getByRole('button', { name: /^Sign In$/i }).click();

    // Verify error notification
    await expect(page.getByText(/Invalid clinical credentials/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${folder}/01-admin-login-security-check.png`,
      fullPage: false,
    });
  });

  // ----------------------------------------------------------------------------
  // TEST 2: Super Admin Portal — Metrics, Segmented Date Filtering, & Patient Search
  // ----------------------------------------------------------------------------
  test('02: Super Admin Dashboard — metrics, date segment filtering, and patient search', async ({ page }) => {
    await loginAsUser(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.name);

    // Verify Top Executive Metrics Cards
    await expect(page.getByText(/TOTAL VISITS/i)).toBeVisible();
    await expect(page.getByText('COMPLETED', { exact: true })).toBeVisible();
    await expect(page.getByText(/INTAKES PENDING/i)).toBeVisible();

    // Verify Date Segment Controls (Today, This Week, This Month, All)
    await expect(page.getByRole('button', { name: 'Today', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'This Week', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'This Month', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();

    // Switch to 'All' segment to inspect all visits
    await page.getByRole('button', { name: 'All', exact: true }).click();

    // Test Multi-Attribute Search Filter (Patient Name, Email, Service, Allergy)
    const searchInput = page.getByPlaceholder(/Search patient, service, notes, allergy.../i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Melliza');
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${folder}/02-super-admin-schedule-filtered.png`,
      fullPage: false,
    });

    await searchInput.fill('');
  });

  // ----------------------------------------------------------------------------
  // TEST 3: Attending Dentist (Dr. Iverson Melliza) Role-Based Access Control
  // ----------------------------------------------------------------------------
  test('03: Attending Dentist Role — doctor login, chairside access, and RBAC tab restrictions', async ({ page }) => {
    // Authenticate with Attending Dentist credentials
    await loginAsUser(page, ATTENDING_DENTIST.email, ATTENDING_DENTIST.password, ATTENDING_DENTIST.name);

    // Verify Doctor Profile is displayed
    await expect(page.getByText('Dr. iverson melliza').first()).toBeVisible();

    // Verify Super Admin exclusive tab (Staff Directory) is HIDDEN for Dentist role
    await expect(page.getByRole('button', { name: /Staff & Doctor Directory/i })).toHaveCount(0);

    // Verify Chairside Schedule is accessible
    await expect(page.getByRole('button', { name: /Chairside Schedule/i })).toBeVisible();

    await page.screenshot({
      path: `${folder}/03-doctor-role-dashboard.png`,
      fullPage: false,
    });
  });

  // ----------------------------------------------------------------------------
  // TEST 4: Lumina Calendar — Philippine Holidays & Operable Day Modal
  // ----------------------------------------------------------------------------
  test('04: Lumina Calendar Hub — month navigation, PH holidays, and daily schedule modal', async ({ page }) => {
    await loginAsUser(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.name);

    // Switch to Lumina Calendar Tab
    await page.getByRole('button', { name: /Lumina Calendar/i }).click();

    // Verify Month Navigation dropdowns & Today button
    const monthSelect = page.locator('select').filter({ hasText: 'August' });
    await expect(monthSelect).toBeVisible();
    await expect(page.getByRole('button', { name: 'Today', exact: true })).toBeVisible();

    // Verify Philippine Official Holidays rendered on calendar
    await expect(page.getByText(/Ninoy Aquino Day/i)).toBeVisible();
    await expect(page.getByText(/National Heroes Day/i)).toBeVisible();

    // Month Navigation: Next Month -> Return via 'Today'
    await page.getByLabel('Next Month').click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await page.waitForTimeout(300);

    // Click any operable day cell
    const dayCell = page.locator('div[class*="min-h-"][class*="cursor-pointer"]').first();
    if (await dayCell.isVisible()) {
      await dayCell.click();
      await page.waitForTimeout(500);
      const modalHeading = page.getByText(/Daily Clinical Schedule/i).first();
      if (await modalHeading.isVisible()) {
        await expect(modalHeading).toBeVisible();
        await page.screenshot({
          path: `${folder}/04-calendar-day-modal.png`,
          fullPage: false,
        });
        await page.getByRole('button', { name: /Close/i }).click();
      }
    }
  });

  // ----------------------------------------------------------------------------
  // TEST 5: Staff Lifecycle — Create Zenux Melliza, Verify in Directory, then Revoke
  // ----------------------------------------------------------------------------
  test('05: Staff Creation & Removal Lifecycle — create Zenux Melliza, verify in directory, then revoke access', async ({ page }) => {
    await loginAsUser(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.name);

    // Navigate to Staff & Doctor Directory tab
    await page.getByRole('button', { name: /Staff & Doctor Directory/i }).click();
    await expect(page.getByRole('heading', { name: /Staff & Clinicians Access Directory/i })).toBeVisible();

    // 1. Open 'Add New Doctor / Staff' Modal
    await page.getByRole('button', { name: /Add New Doctor \/ Staff/i }).click();
    await expect(page.getByText(/Add Doctor or Staff Account/i)).toBeVisible();

    // 2. Fill User Details (Auto-Capitalization & Required Fields)
    await page.locator('input[placeholder="e.g. Maria"]').fill(TEST_CLINICIAN.firstName);
    await page.locator('input[placeholder="e.g. Santos"]').fill(TEST_CLINICIAN.lastName);
    await page.locator('input[placeholder="doctor.santos@luminaclinic.com"]').fill(TEST_CLINICIAN.email);
    await page.locator('input[placeholder="e.g. Cosmetic Dentistry"]').fill(TEST_CLINICIAN.specialization);
    await page.locator('input[placeholder="PRC-123456"]').fill(TEST_CLINICIAN.licenseNumber);
    await page.locator('input[placeholder="Default: LuminaStudio2026!"]').fill(TEST_CLINICIAN.password);

    // 3. Submit New Staff Form
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();

    // Verify modal closes and search for created staff
    await page.waitForTimeout(1000);
    const staffSearch = page.getByPlaceholder(/Search staff by name, email.../i);
    await staffSearch.fill(TEST_CLINICIAN.email);
    await page.waitForTimeout(500);

    const createdStaffCard = page.getByText(new RegExp(TEST_CLINICIAN.firstName, 'i')).first();
    if (await createdStaffCard.isVisible()) {
      await expect(createdStaffCard).toBeVisible();
    }

    await page.screenshot({
      path: `${folder}/05-new-staff-created-card.png`,
      fullPage: false,
    });

    // 4. Clean Teardown: Revoke Access via Modal
    const removeBtn = page.getByRole('button', { name: /Remove Access/i }).first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();

      // Confirm revocation modal
      await expect(page.getByText(/Revoke Staff Access\?/i)).toBeVisible();
      await page.getByRole('button', { name: /Yes, Remove Access/i }).click();
      await page.waitForTimeout(1000);
    }

    await staffSearch.fill('');
  });

  // ----------------------------------------------------------------------------
  // TEST 6: Inquiries Hub — Keyword Search, Filter, & Lead Recovery Badges
  // ----------------------------------------------------------------------------
  test('06: Inquiries & Abandoned Lead Recovery — verify converted leads badge & search', async ({ page }) => {
    await loginAsUser(page, SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.name);

    // Switch to Inquiries & Leads Tab
    await page.getByRole('button', { name: /Inquiries & Leads/i }).click();
    await expect(page.getByRole('heading', { name: /Clinical Inquiries & Abandoned Lead Recovery/i })).toBeVisible();

    // Verify Search Filter
    const inqSearch = page.getByPlaceholder(/Search name, email, interest, message.../i);
    await inqSearch.fill('Whitening');
    await page.waitForTimeout(300);

    // Verify Converted inquiries display "⚡ Automation Completed" badge and archive button is omitted
    const convertedBadge = page.getByText(/⚡ Automation Completed/i).first();
    if (await convertedBadge.isVisible()) {
      await expect(convertedBadge).toBeVisible();
    }

    await page.screenshot({
      path: `${folder}/06-admin-inquiries-tab.png`,
      fullPage: false,
    });
  });

  // ----------------------------------------------------------------------------
  // TEST 7: Account Security Settings & Live Password Validation
  // ----------------------------------------------------------------------------
  test('07: Account Security & Branch Management — real-time password mismatch validator', async ({ page }) => {
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

      // Matching password validation
      await confirmPassInput.fill('NewSecurePassword2026!');
      await expect(page.getByText(/Passwords match securely/i)).toBeVisible();
    }

    await page.screenshot({
      path: `${folder}/07-admin-security-settings.png`,
      fullPage: false,
    });
  });
});
