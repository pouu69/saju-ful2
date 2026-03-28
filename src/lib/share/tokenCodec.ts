// Encodes saju input (without name) into a ~16-char base64url token
// Format: YYYYMMDD + HH (xx=unknown) + G (M/F) + C (S/L) = 12 chars → base64url ~16 chars

export interface ShareTokenData {
  year: number;
  month: number;
  day: number;
  hour: number | null;       // null = 모름
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
}

export function encodeShareToken(data: ShareTokenData): string {
  const y = String(data.year).padStart(4, '0');
  const m = String(data.month).padStart(2, '0');
  const d = String(data.day).padStart(2, '0');
  const h = data.hour === null ? 'xx' : String(data.hour).padStart(2, '0');
  const g = data.gender === 'male' ? 'M' : 'F';
  const c = data.calendarType === 'solar' ? 'S' : 'L';
  const raw = `${y}${m}${d}${h}${g}${c}`;
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeShareToken(token: string): ShareTokenData | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob(padded);
    if (raw.length < 12) return null;

    const year = parseInt(raw.slice(0, 4), 10);
    const month = parseInt(raw.slice(4, 6), 10);
    const day = parseInt(raw.slice(6, 8), 10);
    const hourStr = raw.slice(8, 10);
    const hour = hourStr === 'xx' ? null : parseInt(hourStr, 10);
    const gender: 'male' | 'female' = raw[10] === 'M' ? 'male' : 'female';
    const calendarType: 'solar' | 'lunar' = raw[11] === 'S' ? 'solar' : 'lunar';

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    return { year, month, day, hour, gender, calendarType };
  } catch {
    return null;
  }
}
