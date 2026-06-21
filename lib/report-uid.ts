export const REPORT_UID_PATTERN = /^[A-Z0-9][A-Z0-9-]{5,39}$/;

export function normalizeReportUID(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/^UID\s*:\s*/i, "")
    .replace(/\s+/g, "");
}

export function isValidReportUID(value: string) {
  return REPORT_UID_PATTERN.test(value);
}
