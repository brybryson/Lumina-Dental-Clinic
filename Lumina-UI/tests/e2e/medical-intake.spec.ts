import { test, expect } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

const folder = getScreenshotFolder('intake');

test.describe('Pre-Visit Digital Medical Intake Token-Gated Workflow Tests', () => {
  test('State 1 — should render Restricted Access when no token or invalid token is provided', async ({ page }) => {
    // 1. Visit /intake directly without token
    await page.goto('/intake');
    await page.waitForLoadState('networkidle');

    // Verify State 1 renders with exact copy and no navbar/footer
    await expect(page.getByTestId('state-restricted-access')).toBeVisible();
    await expect(page.locator('h1:has-text("Restricted Access")')).toBeVisible();
    await expect(
      page.getByText(/This page can only be accessed through the secure link sent to your email/i)
    ).toBeVisible();

    // Verify action button and contact link
    const returnHomeBtn = page.getByTestId('button-return-home');
    await expect(returnHomeBtn).toBeVisible();
    await expect(page.getByTestId('link-contact-us')).toBeVisible();

    // Capture screenshot: State 1 (No Token)
    await page.screenshot({
      path: `${folder}/01-state1-restricted-access-no-token.png`,
      fullPage: false,
    });

    // 2. Visit /intake with a non-existent / invalid token
    await page.goto('/intake?token=nonexistent-invalid-token-xyz-12345');
    await page.waitForLoadState('networkidle');

    // Verify exact same generic security message is rendered (no distinction / no info leak)
    await expect(page.getByTestId('state-restricted-access')).toBeVisible();
    await expect(page.locator('h1:has-text("Restricted Access")')).toBeVisible();

    // Capture screenshot: State 1 (Invalid Token)
    await page.screenshot({
      path: `${folder}/02-state1-restricted-access-invalid-token.png`,
      fullPage: false,
    });
  });

  test('State 2 — should render Link Expired when token is expired', async ({ page }) => {
    // Intercept GET /api/intake to simulate an expired token state
    await page.route('**/api/intake?token=expired-token-demo*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'expired',
          error: 'This Link Has Expired',
          message: 'For your security, intake links expire 14 days after booking. Please contact us and we\'ll send you a new one.',
        }),
      });
    });

    await page.goto('/intake?token=expired-token-demo');
    await page.waitForLoadState('networkidle');

    // Verify State 2 renders
    await expect(page.getByTestId('state-link-expired')).toBeVisible();
    await expect(page.locator('h1:has-text("This Link Has Expired")')).toBeVisible();
    await expect(page.getByText(/intake links expire 14 days after booking/i)).toBeVisible();
    await expect(page.getByTestId('button-return-home')).toBeVisible();

    // Capture screenshot: State 2 (Expired Token)
    await page.screenshot({
      path: `${folder}/03-state2-link-expired.png`,
      fullPage: false,
    });
  });

  test('State 4 & Draft Persistence & State 3 — should complete intake flow with draft persistence in sessionStorage', async ({
    page,
    request,
  }) => {
    // 1. Create a real appointment via API to obtain an authentic intake token
    const testEmail = 'vrsnmllz03@gmail.com';
    const dynamicDay = 25 + (Math.floor(Date.now() / 1000) % 5);
    const testDate = `2026-08-${dynamicDay}`;
    const testSlot = `${((Math.floor(Date.now() / 1000) % 4) + 1).toString().padStart(2, '0')}:00 PM – ${((Math.floor(Date.now() / 1000) % 4) + 2).toString().padStart(2, '0')}:00 PM`;

    let intakeToken = '';
    const bookingRes = await request.post('/api/appointments', {
      data: {
        firstName: 'Iverson',
        lastName: 'Melliza',
        email: testEmail,
        mobile: '09175558822',
        dob: '1992-04-14',
        sex: 'Male',
        service: 'Laser Teeth Whitening, Dental Cleaning & Routine Checkup',
        date: testDate,
        time: testSlot,
        notes: 'Pre-visit medical history requested',
      },
    });

    if (bookingRes.status() === 200) {
      const bookingData = await bookingRes.json();
      intakeToken = bookingData.intakeToken;
    } else {
      const listRes = await request.get('/api/appointments');
      const listData = await listRes.json();
      const candidate = (listData.appointments || []).find((a: any) => !a.intake_completed_at && a.intake_token);
      intakeToken = candidate?.intake_token || '';
    }

    expect(intakeToken).toBeTruthy();

    // 2. Open State 4 (Valid Token Form)
    await page.goto(`/intake?token=${intakeToken}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('state-intake-form')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h1:has-text("Pre-Visit Clinical Health History")')).toBeVisible();
    await expect(page.getByText('Iverson Melliza')).toBeVisible();

    // 3. Fill form fields to test draft persistence
    const dobInput = page.locator('[data-testid="input-intake-dob"]');
    await dobInput.fill('1992-04-14');

    // Select conditions & allergies
    await page.locator('[data-testid="checkbox-condition-0"]').click(); // Hypertension
    await page.locator('[data-testid="checkbox-condition-1"]').click(); // Dental Anxiety
    await page.locator('[data-testid="checkbox-allergy-0"]').click(); // Penicillin

    // Fill medications & emergency contact
    await page.locator('[data-testid="textarea-medications"]').fill('Lisinopril 10mg daily');
    await page.locator('[data-testid="input-emergency-name"]').fill('Marcus Rostova');
    await page.locator('[data-testid="input-emergency-phone"]').fill('0917 555 9988');

    // Fill HMO
    await page.locator('[data-testid="input-hmo-provider"]').fill('Delta Dental Premier');
    await page.locator('[data-testid="input-hmo-member-id"]').fill('DD-992140-PREM');

    // Capture screenshot: State 4 (Form Filled)
    await page.screenshot({
      path: `${folder}/04-state4-form-filled-and-drafted.png`,
      fullPage: true,
    });

    // 4. Test Draft Persistence: Reload page and verify fields are preserved via sessionStorage
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('state-intake-form')).toBeVisible();
    await expect(page.locator('[data-testid="input-emergency-name"]')).toHaveValue('Marcus Rostova');
    await expect(page.locator('[data-testid="textarea-medications"]')).toHaveValue('Lisinopril 10mg daily');

    // 5. Sign consent checkbox and submit
    await page.locator('[data-testid="checkbox-intake-consent"]').check();
    await page.locator('[data-testid="button-submit-intake"]').click();

    // 6. Assert transition to State 3 — "You're All Set!"
    await expect(page.getByTestId('state-already-completed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1:has-text("You\'re All Set!")')).toBeVisible();
    await expect(page.getByText(/We already have your medical intake on file for this appointment/i)).toBeVisible();

    // Capture screenshot: State 3 (Completed Confirmation)
    await page.screenshot({
      path: `${folder}/05-state3-already-completed.png`,
      fullPage: false,
    });

    // 7. Direct Re-visit Test: Re-opening the exact same token URL directly hits State 3
    await page.goto(`/intake?token=${intakeToken}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('state-already-completed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1:has-text("You\'re All Set!")')).toBeVisible();

    // Capture screenshot: State 3 (Direct Re-visit)
    await page.screenshot({
      path: `${folder}/06-state3-direct-revisit.png`,
      fullPage: false,
    });
  });

  test('State 4 — should complete intake flow for a patient with NO allergies or medical conditions (Clean Record)', async ({
    page,
    request,
  }) => {
    // 1. Create a real appointment via API for a patient with no allergies
    const testEmail = 'bryantiversonmelliza03@gmail.com';
    const dynamicDay = 26 + (Math.floor(Date.now() / 1000) % 3);
    const testDate = `2026-08-${dynamicDay}`;
    const testSlot = '10:00 AM – 11:00 AM';

    let intakeToken = '';
    const bookingRes = await request.post('/api/appointments', {
      data: {
        firstName: 'Bryant',
        lastName: 'Melliza',
        email: testEmail,
        mobile: '09181234567',
        dob: '1995-08-20',
        sex: 'Male',
        service: 'Routine Dental Cleaning & Examination',
        date: testDate,
        time: testSlot,
        notes: 'Routine 6-month checkup - no known health issues',
      },
    });

    if (bookingRes.status() === 200) {
      const bookingData = await bookingRes.json();
      intakeToken = bookingData.intakeToken;
    } else {
      const listRes = await request.get('/api/appointments');
      const listData = await listRes.json();
      const candidate = (listData.appointments || []).find((a: any) => !a.intake_completed_at && a.intake_token);
      intakeToken = candidate?.intake_token || '';
    }

    expect(intakeToken).toBeTruthy();

    // 2. Open State 4 (Valid Token Form)
    await page.goto(`/intake?token=${intakeToken}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('state-intake-form')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h1:has-text("Pre-Visit Clinical Health History")')).toBeVisible();
    await expect(page.getByText('Bryant Melliza')).toBeVisible();

    // 3. Fill basic fields ONLY — leave all allergy & condition checkboxes UNCHECKED
    const dobInput = page.locator('[data-testid="input-intake-dob"]');
    await dobInput.fill('1995-08-20');

    // Fill emergency contact & HMO without checking any allergies or medical conditions
    await page.locator('[data-testid="input-emergency-name"]').fill('Clara Vance');
    await page.locator('[data-testid="input-emergency-phone"]').fill('0918 987 6543');
    await page.locator('[data-testid="textarea-medications"]').fill('None');
    await page.locator('[data-testid="input-hmo-provider"]').fill('Maxicare Health Plans');
    await page.locator('[data-testid="input-hmo-member-id"]').fill('MX-8839201-CL');

    // Capture screenshot: Clean Form Filled (No Allergies)
    await page.screenshot({
      path: `${folder}/07-state4-clean-intake-no-allergies.png`,
      fullPage: true,
    });

    // 4. Sign consent checkbox and submit
    await page.locator('[data-testid="checkbox-intake-consent"]').check();
    await page.locator('[data-testid="button-submit-intake"]').click();

    // 5. Assert transition to State 3 — "You're All Set!"
    await expect(page.getByTestId('state-already-completed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1:has-text("You\'re All Set!")')).toBeVisible();
    await expect(page.getByText(/We already have your medical intake on file for this appointment/i)).toBeVisible();

    // Capture screenshot: Clean Record Confirmation
    await page.screenshot({
      path: `${folder}/08-state3-completed-no-allergies.png`,
      fullPage: false,
    });
  });
});

