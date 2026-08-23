import { test, expect } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

const folder = getScreenshotFolder('booking');

test.describe('Direct Appointment Booking Funnel E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#booking-section');
    await page.waitForLoadState('networkidle');

    // Switch to "Book an Appointment" mode
    const bookingTabBtn = page.getByTestId('tab-booking');
    await bookingTabBtn.click();
  });

  test('should validate Step 1 required patient details', async ({ page }) => {
    const continueBtn = page.getByTestId('button-booking-contact-continue');
    await continueBtn.click();

    // Verify validation errors
    await expect(page.getByText(/Please enter your first name/i)).toBeVisible();
    await expect(page.getByText(/Please enter your last name/i)).toBeVisible();
    await expect(page.getByText(/Enter a valid email address/i)).toBeVisible();
    await expect(page.getByText(/Mobile number must/i)).toBeVisible();
    await expect(page.getByText(/Please select your date of birth/i)).toBeVisible();
    await expect(page.getByText(/Please select your sex assigned at birth/i)).toBeVisible();

    // Capture validation errors screenshot
    await page.screenshot({
      path: `${folder}/01-booking-step1-validation-errors.png`,
      fullPage: false,
    });
  });

  test('should verify booked slots and fully booked days cannot be selected', async ({ page }) => {
    // Fill Step 1 to reach Step 3
    await page.getByTestId('input-first-name').fill('Alex');
    await page.getByTestId('input-last-name').fill('Mercer');
    await page.getByTestId('input-email').fill('alex.mercer@example.com');
    await page.getByTestId('input-mobile').fill('09175554321');
    await page.getByTestId('button-dob-picker').click();
    await page.getByRole('button', { name: '20', exact: true }).click();
    await page.getByTestId('button-sex-male').click();
    await page.getByTestId('button-booking-contact-continue').click();

    // Select Treatment in Step 2
    const serviceCard = page.getByTestId('service-card-laser-teeth-whitening');
    await serviceCard.click();
    await page.getByTestId('button-booking-service-continue').click();

    // In Step 3: Verify Fully Booked day (e.g. Day 14) has tooltip and is disabled
    const fullyBookedDay = page.getByTitle(/Fully booked — All appointment slots occupied/i).first();
    await expect(fullyBookedDay).toBeDisabled();

    // Select Day 13 (which has pre-booked slots)
    const day13 = page.getByRole('button', { name: '13', exact: true });
    await day13.click();

    // Verify booked slot (09:00 AM – 10:00 AM) is disabled and shows "Booked" badge
    const bookedSlotBtn = page.locator('button[data-testid^="radio-time-"][disabled]').first();
    await expect(bookedSlotBtn).toBeDisabled();
    await expect(bookedSlotBtn.getByText(/Booked/i)).toBeVisible();

    // Capture screenshot demonstrating disabled booked slots & full day lockouts
    await page.screenshot({
      path: `${folder}/02-booking-locked-slots-demonstration.png`,
      fullPage: false,
    });
  });

  test('should complete full 3-step appointment booking flow with multi-select treatments, submit to database, and show confirmation', async ({ page }) => {
    // ----------------------------------------------------
    // STEP 1: Personal & Health Details
    // ----------------------------------------------------
    await page.getByTestId('input-first-name').fill('Michael');
    await page.getByTestId('input-last-name').fill('Chang');
    await page.getByTestId('input-email').fill('michael.chang@example.com');
    await page.getByTestId('input-mobile').fill('09175551234');

    // Open Custom DOB Picker and select day 15
    await page.getByTestId('button-dob-picker').click();
    await page.getByRole('button', { name: '15', exact: true }).click();

    // Select Sex assigned at birth
    await page.getByTestId('button-sex-male').click();

    await page.screenshot({
      path: `${folder}/03-booking-step1-filled.png`,
      fullPage: false,
    });

    // Continue to Step 2
    await page.getByTestId('button-booking-contact-continue').click();

    // ----------------------------------------------------
    // STEP 2: Choose Treatment (Multi-select)
    // ----------------------------------------------------
    await expect(page.getByText(/Select your clinical treatment/i)).toBeVisible();

    // Pick 'Dental Cleaning & Routine Checkup' AND 'Laser Teeth Whitening'
    const cleanCard = page.getByTestId('service-card-dental-cleaning---routine-checkup');
    await cleanCard.click();
    const whiteningCard = page.getByTestId('service-card-laser-teeth-whitening');
    await whiteningCard.click();

    // Verify counter shows 2 selected
    await expect(page.getByText('2 selected')).toBeVisible();

    // Fill clinical notes
    await page.getByTestId('input-booking-notes').fill('Mild sensitivity on lower left molar.');

    await page.screenshot({
      path: `${folder}/04-booking-step2-multi-treatment-selected.png`,
      fullPage: false,
    });

    // Continue to Step 3
    await page.getByTestId('button-booking-service-continue').click();

    // ----------------------------------------------------
    // STEP 3: Calendar Date & Time Slot
    // ----------------------------------------------------
    await expect(page.getByText(/Find your best appointment time/i)).toBeVisible();

    // Verify Calendar is rendered with availability legend
    await expect(page.getByText('Available', { exact: true })).toBeVisible();
    await expect(page.getByText('Fully Booked', { exact: true })).toBeVisible();

    // Pick an open date (e.g. Day 18)
    const openDay = page.getByRole('button', { name: '18', exact: true });
    await openDay.click({ force: true });

    // Pick an available time slot
    const availableSlot = page.locator('button[data-testid^="radio-time-"]:not([disabled])').first();
    await availableSlot.click({ force: true });

    // Verify Selection Summary card appears with Patient and both Selected Care pills
    await expect(page.locator('strong:has-text("Michael Chang")')).toBeVisible();
    await expect(page.locator('span:has-text("Dental Cleaning & Routine Checkup")')).toBeVisible();
    await expect(page.locator('span:has-text("Laser Teeth Whitening")')).toBeVisible();

    await page.screenshot({
      path: `${folder}/05-booking-step3-slot-selected.png`,
      fullPage: false,
    });

    // Submit the reservation (persists into Supabase database patients & appointments tables)
    const confirmBtn = page.getByTestId('button-confirm-booking');
    await confirmBtn.click();

    // ----------------------------------------------------
    // STEP 4: Success Confirmation Screen
    // ----------------------------------------------------
    await expect(page.locator('h3:has-text("Thank you, Michael!")')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('michael.chang@example.com')).toBeVisible();
    const bookAnotherBtn = page.getByTestId('button-book-another');
    await expect(bookAnotherBtn).toBeVisible();

    // Capture the actual confirmed/success screen
    await page.screenshot({
      path: `${folder}/06-booking-step4-confirmed-success.png`,
      fullPage: false,
    });

    // Click Book Another Visit to verify clean reset without auto-redirect
    await bookAnotherBtn.click();
    await expect(page.getByTestId('button-booking-contact-continue')).toBeVisible();
  });
});
