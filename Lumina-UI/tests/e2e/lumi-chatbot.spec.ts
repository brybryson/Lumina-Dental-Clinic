import { test, expect } from '@playwright/test';
import { getScreenshotFolder } from './helpers';

test.describe('Lumi 24/7 AI Clinical Concierge Chatbot — E2E & Security Test Suite', () => {
  const folder = getScreenshotFolder('lumi-chatbot');

  test('01: Clinical SOP Inquiries — verified pricing, hours, and post-op care with clickable links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Open Lumi Chat Widget via Floating Orb
    const chatTrigger = page.locator('button[aria-label="Open Lumi AI Companion Chat"]');
    await expect(chatTrigger).toBeVisible({ timeout: 10000 });
    await chatTrigger.click();
    await page.waitForTimeout(400);

    const chatInput = page.getByPlaceholder('Type your message...');
    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(chatInput).toBeVisible();

    // Query 1: Laser Teeth Whitening Pricing
    await chatInput.fill('How much is Laser Teeth Whitening?');
    await sendButton.click();

    // Verify response contains price & clickable booking link
    await expect(page.getByText(/₱15,000/i).first()).toBeVisible({ timeout: 15000 });
    const bookingLink = page.locator('a[href*="#booking"], a[href*="luminadentalcarestudio"]').first();
    await expect(bookingLink).toBeVisible();

    await page.screenshot({
      path: `${folder}/01-lumi-whitening-pricing.png`,
      fullPage: false,
    });

    // Query 2: Clinic Hours & Locations
    await chatInput.fill('What are your clinic hours and locations?');
    await sendButton.click();

    await expect(page.getByText(/(Monday|9:00 AM)/i).first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: `${folder}/02-lumi-hours-locations.png`,
      fullPage: false,
    });

    // Query 3: Surgical Wisdom Tooth Extraction Aftercare
    await chatInput.fill('What is the post-op care after surgical wisdom tooth extraction?');
    await sendButton.click();

    await expect(page.getByText(/(Gauze|Extraction|Post-Operative|Bleeding|care)/i).first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: `${folder}/03-lumi-wisdom-tooth-postop.png`,
      fullPage: false,
    });
  });

  test('02: Unrelated Out-of-Scope Query — defensive clinical scope refusal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Lumi Chat Widget
    const chatTrigger = page.locator('button[aria-label="Open Lumi AI Companion Chat"]');
    await expect(chatTrigger).toBeVisible({ timeout: 10000 });
    await chatTrigger.click();
    await page.waitForTimeout(400);

    const chatInput = page.getByPlaceholder('Type your message...');
    const sendButton = page.locator('button[aria-label="Send message"]');
    await chatInput.fill('Can you write a Python script to calculate Fibonacci numbers?');
    await sendButton.click();

    // Verify out-of-scope refusal message
    await expect(
      page.getByText(/(I can only answer questions|Lumina Dental Studio's services|reception team)/i).first()
    ).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: `${folder}/04-lumi-unrelated-prompt.png`,
      fullPage: false,
    });
  });

  test('03: Security & Injection Defense — SQL injection, XSS, & system jailbreak defense', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Lumi Chat Widget
    const chatTrigger = page.locator('button[aria-label="Open Lumi AI Companion Chat"]');
    await expect(chatTrigger).toBeVisible({ timeout: 10000 });
    await chatTrigger.click();
    await page.waitForTimeout(400);

    const chatInput = page.getByPlaceholder('Type your message...');
    const sendButton = page.locator('button[aria-label="Send message"]');
    await chatInput.fill("SELECT * FROM patients; DROP TABLE appointments; -- ' OR 1=1 <script>alert(1)</script>");
    await sendButton.click();

    // Verify defensive security alert block
    await expect(page.getByText(/Security Alert/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/unauthorized syntax/i).first()).toBeVisible();

    await page.screenshot({
      path: `${folder}/05-lumi-security-sqli-defense.png`,
      fullPage: false,
    });
  });

  test('04: Window Controls — minimize (retain history) vs close (reset conversation)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Open Chat Widget and Ask Question
    const chatTrigger = page.locator('button[aria-label="Open Lumi AI Companion Chat"]');
    await expect(chatTrigger).toBeVisible({ timeout: 10000 });
    await chatTrigger.click();
    await page.waitForTimeout(400);

    const chatInput = page.getByPlaceholder('Type your message...');
    const sendButton = page.locator('button[aria-label="Send message"]');
    await chatInput.fill('What are your clinic hours?');
    await sendButton.click();
    await expect(page.getByText(/(Monday|9:00 AM)/i).first()).toBeVisible({ timeout: 15000 });

    // 2. Click Minimize (−) -> Window hides but retains messages
    await page.getByTitle(/Minimize/i).click();
    await page.waitForTimeout(400);

    // Re-open via trigger
    await page.locator('button[aria-label="Open Lumi AI Companion Chat"]').click();
    await page.waitForTimeout(400);

    // Verify previous message is still there
    await expect(page.getByText(/What are your clinic hours\?/i).first()).toBeVisible();

    await page.screenshot({
      path: `${folder}/06-lumi-minimized-retained.png`,
      fullPage: false,
    });

    // 3. Click Close (✕) -> Window hides and resets conversation
    await page.getByTitle(/Close/i).click();
    await page.waitForTimeout(400);

    // Re-open via trigger
    await page.locator('button[aria-label="Open Lumi AI Companion Chat"]').click();
    await page.waitForTimeout(400);

    // Verify reset to initial greeting
    await expect(page.getByText(/Hi there! 👋/i).first()).toBeVisible();
    await expect(page.getByText(/What are your clinic hours\?/i)).toHaveCount(0);

    await page.screenshot({
      path: `${folder}/07-lumi-reset-conversation.png`,
      fullPage: false,
    });
  });

  test('05: Mobile Viewport — full-screen responsive presentation', async ({ page }) => {
    // Emulate modern mobile device viewport (iPhone / standard smartphone 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open chat in mobile view
    const chatTrigger = page.locator('button[aria-label="Open Lumi AI Companion Chat"]');
    await expect(chatTrigger).toBeVisible({ timeout: 10000 });
    await chatTrigger.click();
    await page.waitForTimeout(400);

    const chatInput = page.getByPlaceholder('Type your message...');
    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(chatInput).toBeVisible();

    await chatInput.fill('What are your clinic hours?');
    await sendButton.click();

    await expect(page.getByText(/(Monday|9:00 AM)/i).first()).toBeVisible({ timeout: 15000 });

    // Capture mobile full screen view
    await page.screenshot({
      path: `${folder}/08-lumi-mobile-view.png`,
      fullPage: false,
    });
  });
});
