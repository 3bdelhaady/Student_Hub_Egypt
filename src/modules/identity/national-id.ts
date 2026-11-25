import { createHmac } from 'node:crypto';
// Validate format and encoded date only. This is not government identity verification.
export function normalizeNationalId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const n = value
    .trim()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776));
  if (!/^[23]\d{13}$/.test(n)) return null;
  const year = (n[0] === '2' ? 1900 : 2000) + Number(n.slice(1, 3));
  const month = Number(n.slice(3, 5)),
    day = Number(n.slice(5, 7));
  const d = new Date(Date.UTC(year, month - 1, day));
  const governorate = Number(n.slice(7, 9));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day ||
    d.getTime() > Date.now() ||
    ![
      1, 2, 3, 4, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32,
      33, 34, 35, 88,
    ].includes(governorate)
  )
    return null;
  return n;
}
export function nationalIdFingerprint(value: string, secret: string) {
  return createHmac('sha256', secret)
    .update('student-hub:national-id:v1:' + value)
    .digest('hex');
}
