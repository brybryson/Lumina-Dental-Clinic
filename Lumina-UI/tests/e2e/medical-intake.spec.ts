import { test, expect } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

const folder = getScreenshotFolder('intake');

test.describe('Pre-Visit Digital Medical Intake E2E & UI Workflow Tests', () => {
  test('should verify access to digital intake portal from landing page navigation and dedicated section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify clean navbar link exists
    const navIntake = page.locator('[data-testid="nav-link-intake"]');
    await expect(navIntake).toBeVisible();
    await expect(navIntake).toHaveText('Digital Intake');

    // 2. Scroll to dedicated Digital Intake section at bottom of landing page
    const intakeSection = page.locator('#digital-intake');
    await intakeSection.scrollIntoViewIfNeeded();
    await expect(intakeSection).toBeVisible();

    const portalBtn = page.locator('[data-testid="link-open-intake-portal"]');
    await expect(portalBtn).toBeVisible();

    // Capture screenshot of the dedicated section
    await page.screenshot({
      path: `${folder}/00-landing-digital-intake-section.png`,
      fullPage: false,
    });

    // 3. Click Open Patient Intake Portal
    await portalBtn.click();
    await page.waitForURL('**/intake**');
    await expect(page.locator('h1:has-text("Pre-Visit Clinical Health History")')).toBeVisible();
  });

  test('should validate API error handling for missing or invalid intake tokens', async ({ request }) => {
    // 1. Missing token
    const missingRes = await request.post('/api/intake', {
      data: {
        medicalConditions: ['Hypertension'],
      },
    });
    expect(missingRes.status()).toBe(400);

    // 2. Invalid token
    const invalidRes = await request.post('/api/intake', {
      data: {
        intakeToken: 'invalid-nonexistent-token',
        medicalConditions: ['Asthma'],
      },
    });
    expect(invalidRes.status()).toBe(404);
  });

  test('should complete full visual digital medical intake flow with live fields, capture screenshots, and persist in Supabase', async ({
    page,
    request,
  }) => {
    // 1. Create a real appointment to obtain an authentic intake token
    const timestamp = Date.now();
    const testEmail = `patient.intake.ui.${timestamp}@example.com`;

    const bookingRes = await request.post('/api/appointments', {
      data: {
        firstName: 'Elena',
        lastName: 'Rostova',
        email: testEmail,
        mobile: '(415) 555-8822',
        dob: '1992-04-14',
        sex: 'Female',
        service: 'Laser Teeth Whitening, Dental Cleaning & Routine Checkup',
        date: '2026-08-29',
        time: '02:00 PM – 03:00 PM',
        notes: 'Pre-visit medical history requested',
      },
    });

    expect(bookingRes.status()).toBe(200);
    const bookingData = await bookingRes.json();
    expect(bookingData.intakeToken).toBeTruthy();

    const intakeToken = bookingData.intakeToken;

    // 2. Navigate in browser to the digital intake page with the authentic token
    await page.goto(`/intake?token=${intakeToken}`);
    await page.waitForLoadState('networkidle');

    // Verify patient banner is populated
    await expect(page.locator('text=Elena Rostova')).toBeVisible();
    await expect(page.locator('text=Laser Teeth Whitening')).toBeVisible();

    // STAGE 1 SCREENSHOT: Initial Form Loaded with Patient Chart
    await page.screenshot({
      path: `${folder}/01-intake-form-loaded-with-patient-data.png`,
      fullPage: true,
    });

    // 3. Fill / verify Date of Birth
    const dobInput = page.locator('[data-testid="input-intake-dob"]');
    await dobInput.fill('1992-04-14');

    // 4. Select Medical Conditions (Hypertension, Dental Anxiety)
    await page.locator('[data-testid="checkbox-condition-0"]').click(); // Hypertension
    await page.locator('[data-testid="checkbox-condition-1"]').click(); // Dental Anxiety

    // STAGE 2 SCREENSHOT: Medical Conditions Selected
    await page.screenshot({
      path: `${folder}/02-intake-medical-conditions-selected.png`,
      fullPage: true,
    });

    // 5. Select Drug & Material Allergies (Penicillin, Latex)
    await page.locator('[data-testid="checkbox-allergy-0"]').click(); // Penicillin
    await page.locator('[data-testid="checkbox-allergy-1"]').click(); // Latex

    // 6. Input Current Medications
    await page
      .locator('[data-testid="textarea-medications"]')
      .fill('Lisinopril 10mg once daily in morning. Multivitamins daily.');

    // STAGE 3 SCREENSHOT: Allergies and Medications Filled
    await page.screenshot({
      path: `${folder}/03-intake-allergies-and-medications-filled.png`,
      fullPage: true,
    });

    // 7. Input Emergency Contact
    await page.locator('[data-testid="input-emergency-name"]').fill('Marcus Rostova');
    await page.locator('[data-testid="input-emergency-phone"]').fill('(415) 555-9988');

    // 8. Input HMO / Insurance Provider & Member ID
    await page.locator('[data-testid="input-hmo-provider"]').fill('Delta Dental Premier');
    await page.locator('[data-testid="input-hmo-member-id"]').fill('DD-992140-PREM');

    // 9. Sign Digital Consent Checkbox
    await page.locator('[data-testid="checkbox-intake-consent"]').check();

    // STAGE 4 SCREENSHOT: Emergency Contact, Insurance & Consent Complete
    await page.screenshot({
      path: `${folder}/04-intake-emergency-and-insurance-ready.png`,
      fullPage: true,
    });

    // 10. Click Submit Button
    const submitBtn = page.locator('[data-testid="button-submit-intake"]');
    await submitBtn.click();

    // 11. Assert Success Screen Appears
    await expect(page.locator('h1:has-text("Medical History Successfully Verified")')).toBeVisible({
      timeout: 10000,
    });

    // STAGE 5 SCREENSHOT: Final Submitted & Verified Screen
    await page.screenshot({
      path: `${folder}/05-intake-submitted-success-screen.png`,
      fullPage: true,
    });

    // 12. Verify Appointment status changed to 'intake_submitted' in API
    const verifyApi = await request.get(`/api/intake?token=${intakeToken}`);
    const verifyJson = await verifyApi.json();
    expect(verifyJson.appointment.status).toBe('intake_submitted');
  });
});
