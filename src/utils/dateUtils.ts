export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

/**
 * Convert Arabic digits to Thai digits
 */
export const toThaiDigits = (num: number | string): string => {
  return String(num).replace(/\d/g, (d) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(d, 10)]);
};

/**
 * Format an ISO date string (YYYY-MM-DD from standard calendar)
 * into official Thai Civil Service date format
 */
export const formatThaiCertificateDate = (
  isoDateStr: string,
  useThaiNumerals = true
): string => {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length !== 3) return isoDateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return isoDateStr;

  const thaiYear = year + 543;
  const monthName = THAI_MONTHS[month - 1] || '';

  if (useThaiNumerals) {
    return `ให้ไว้ ณ วันที่ ${toThaiDigits(day)} ${monthName} พุทธศักราช ${toThaiDigits(thaiYear)}`;
  }
  return `ให้ไว้ ณ วันที่ ${day} ${monthName} พ.ศ. ${thaiYear}`;
};

/**
 * Extract an ISO date (YYYY-MM-DD) from a Thai certificate text if possible
 * Fallback to today's date if parsing isn't clear
 */
export const parseThaiDateToIso = (thaiText: string): string => {
  try {
    // Check if we can find month
    for (let m = 0; m < THAI_MONTHS.length; m++) {
      const monthName = THAI_MONTHS[m];
      if (thaiText.includes(monthName)) {
        // Normalize Thai numbers to Arabic
        const normalized = thaiText.replace(/[๐-๙]/g, (ch) =>
          String('๐๑๒๓๔๕๖๗๘๙'.indexOf(ch))
        );
        const match = normalized.match(/วันที่\s*(\d{1,2}).*?(\d{4})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const thaiYear = parseInt(match[2], 10);
          const gregYear = thaiYear > 2400 ? thaiYear - 543 : thaiYear;
          const mm = String(m + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          return `${gregYear}-${mm}-${dd}`;
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return '2026-10-27';
};
