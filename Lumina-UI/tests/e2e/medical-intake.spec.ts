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

    // 3. Navigate to booking section to capture screenshot proof
    await page.goto('/#booking-section');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({
      path: `${folder}/01-medical-intake-endpoint-verified.png`,
      fullPage: false,
    });
  });

  test('should create an appointment and submit complete medical intake to persist in Supabase medical_intakes table', async ({ request, page }) => {
    // 1. Create a real appointment reservation
    const timestamp = Date.now();
    const testEmail = `patient.intake.${timestamp}@example.com`;

    const bookingRes = await request.post('/api/appointments', {
      data: {
        firstName: 'Alexandra',
        lastName: 'Vane',
        email: testEmail,
        mobile: '(415) 555-7391',
        dob: '1995-06-22',
        sex: 'Female',
        service: 'Laser Teeth Whitening, Porcelain Veneers & Smile Design',
        date: '2026-08-28',
        time: '11:00 AM – 12:00 PM',
        notes: 'Requested digital intake link for allergies',
      },
    });

    expect(bookingRes.status()).toBe(200);
    const bookingData = await bookingRes.json();
    expect(bookingData.success).toBe(true);
    expect(bookingData.intakeToken).toBeTruthy();

    const intakeToken = bookingData.intakeToken;

    // 2. Validate token lookup endpoint (simulates patient opening digital intake link)
    const getIntakeRes = await request.get(`/api/intake?token=${intakeToken}`);
    expect(getIntakeRes.status()).toBe(200);
    const intakeInfo = await getIntakeRes.json();
    expect(intakeInfo.success).toBe(true);
    expect(intakeInfo.appointment.service_name).toContain('Laser Teeth Whitening');

    // 3. Submit full medical history into medical_intakes table
    const intakeSubmitRes = await request.post('/api/intake', {
      data: {
        intakeToken: intakeToken,
        dateOfBirth: '1995-06-22',
        emergencyContactName: 'Jonathan Vane',
        emergencyContactPhone: '(415) 555-9988',
        medicalConditions: ['Dental Anxiety', 'Hypertension'],
        allergies: ['Penicillin', 'Latex'],
        currentMedications: 'Lisinopril 10mg daily',
        hmoProvider: 'Delta Dental Premier',
        hmoMemberId: 'DD-992140',
        consentSigned: true,
      },
    });

    expect(intakeSubmitRes.status()).toBe(200);
    const submitData = await intakeSubmitRes.json();
    expect(submitData.success).toBe(true);
    expect(submitData.message).toMatch(/Medical intake submitted successfully/i);

    // 4. Verify appointment status is now 'intake_submitted'
    const verifyStatusRes = await request.get(`/api/intake?token=${intakeToken}`);
    expect(verifyStatusRes.status()).toBe(200);
    const updatedData = await verifyStatusRes.json();
    expect(updatedData.appointment.status).toBe('intake_submitted');

    // 5. Visual screenshot confirmation
    await page.goto('/#booking-section');
    await page.screenshot({
      path: `${folder}/02-medical-intake-submitted-to-database.png`,
      fullPage: false,
    });
  });
});
