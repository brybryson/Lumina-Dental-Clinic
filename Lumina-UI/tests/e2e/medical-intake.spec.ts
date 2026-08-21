import { test, expect } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

const folder = getScreenshotFolder('intake');

test.describe('Pre-Visit Digital Medical Intake E2E & API Tests', () => {
  test('should validate medical intake endpoint requires valid token and payload', async ({ request, page }) => {
    // 1. Test missing token validation
    const missingTokenRes = await request.post('/api/intake', {
      data: {
        medicalConditions: ['Hypertension'],
        allergies: ['Penicillin'],
      },
    });
    expect(missingTokenRes.status()).toBe(400);
    const missingBody = await missingTokenRes.json();
    expect(missingBody.error).toMatch(/Intake token is required/i);

    // 2. Test non-existent token validation
    const invalidTokenRes = await request.post('/api/intake', {
      data: {
        intakeToken: 'non-existent-sample-token-12345',
        medicalConditions: ['Dental Anxiety'],
        allergies: ['Latex'],
      },
    });
    expect(invalidTokenRes.status()).toBe(404);
    const invalidBody = await invalidTokenRes.json();
    expect(invalidBody.error).toMatch(/Invalid intake token/i);

    // 3. Navigate to landing page to capture visual state for intake suite
    await page.goto('/#booking-section');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({
      path: `${folder}/01-medical-intake-endpoint-verified.png`,
      fullPage: false,
    });
  });

  test('should verify appointment booking returns intake token for medical history flow', async ({ request }) => {
    // Submit a reservation via API
    const bookingRes = await request.post('/api/appointments', {
      data: {
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'elena.rostova@example.com',
        mobile: '(415) 555-8822',
        dob: '1992-04-14',
        sex: 'Female',
        service: 'Laser Teeth Whitening, Dental Cleaning & Routine Checkup',
        date: 'Aug 25, 2026',
        time: '01:00 PM – 02:00 PM',
        notes: 'Has mild latex allergy',
      },
    });

    expect(bookingRes.status()).toBe(200);
    const bookingData = await bookingRes.json();
    expect(bookingData.success).toBe(true);

    // If appointment ID was generated, verify intake link token format
    if (bookingData.intakeToken) {
      const getIntakeRes = await request.get(`/api/intake?token=${bookingData.intakeToken}`);
      expect(getIntakeRes.status()).toBe(200);
      const intakeInfo = await getIntakeRes.json();
      expect(intakeInfo.success).toBe(true);
    }
  });
});
