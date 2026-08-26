/**
 * Helper to generate categorized screenshot folders for E2E tests
 * All screenshots within the same test run session are compiled into one single timestamped folder.
 * Subfolders can be specified to organize tests into clean subcategories:
 * - Chairside Schedule
 * - Lumina Calendar
 * - Inquiries & Leads
 * - Staff & Doctor Directory
 * - Security
 */
const sessionFolderCache: Record<string, string> = {};

export function getScreenshotFolder(
  suiteName: 'inquiry' | 'booking' | 'intake' | 'unsubscribe' | 'admin' | 'lumi-chatbot',
  subCategory?: string
): string {
  if (!sessionFolderCache[suiteName]) {
    const now = new Date();
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const hours24 = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    sessionFolderCache[suiteName] = `tests/screenshots/${suiteName}/${suiteName}-${month}${day}-${hours24}:${minutes}`;
  }

  const base = sessionFolderCache[suiteName];
  return subCategory ? `${base}/${subCategory}` : base;
}

