/**
 * Helper to generate categorized screenshot folders for E2E tests
 * Structure:
 * > screenshots
 *   >> booking
 *   >> inquiry
 *   >> intake
 */
export function getScreenshotFolder(suiteName: 'inquiry' | 'booking' | 'intake'): string {
  const now = new Date();
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = months[now.getMonth()];
  const day = now.getDate();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `tests/screenshots/${suiteName}/${suiteName}-${month}${day}-${hours}:${minutes}${ampm}`;
}
