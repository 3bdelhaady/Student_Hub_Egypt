import { z } from 'zod';
import { parse } from 'csv-parse/sync';
export function normalizeSerial(value: string) {
  return value.trim().toUpperCase();
}
export const serialInput = z
  .string()
  .transform(normalizeSerial)
  .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9-]{11,63}$/));
export function validIssueDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T12:00:00Z');
  return Number.isFinite(+d) && d.toISOString().slice(0, 10) === value;
}
export const certificateInput = z.object({
  serial: z.union([z.literal(''), serialInput]),
  recipientName: z.string().trim().min(2).max(160),
  certificateTitle: z.string().trim().min(2).max(200),
  issuedOn: z.string().refine(validIssueDate),
});
export type CertificateInput = z.infer<typeof certificateInput>;
export function parseCertificateCsv(input: string): CertificateInput[] {
  if (new TextEncoder().encode(input).byteLength > 256000) throw new Error('CSV exceeds 256 KB');
  const columns = ['serial', 'recipientName', 'certificateTitle', 'issuedOn'];
  const rows = parse(input, {
    bom: true,
    columns: (headers: string[]) => {
      if (headers.length !== columns.length || headers.some((h, i) => h !== columns[i]))
        throw new Error('CSV headers');
      return headers;
    },
    skip_empty_lines: true,
    trim: true,
    max_record_size: 16000,
  }) as unknown[];
  if (!rows.length || rows.length > 200) throw new Error('CSV needs 1 to 200 rows');
  const result = rows.map((row) => certificateInput.parse(row));
  const serials = result.map((r) => r.serial).filter(Boolean);
  if (new Set(serials).size !== serials.length) throw new Error('Duplicate serial in CSV');
  return result;
}
