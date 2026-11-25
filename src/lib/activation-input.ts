import { z } from 'zod';
import { parse } from 'csv-parse/sync';
export const activationInput = z
  .object({ emails: z.array(z.string().trim().toLowerCase().email().max(254)).min(1).max(100) })
  .strict();
export function parseActivationCsv(csv: string): string[] {
  if (Buffer.byteLength(csv, 'utf8') > 32768) throw new Error('CSV too large');
  const rows = parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    max_record_size: 1024,
    relax_column_count: false,
  }) as Record<string, string>[];
  if (
    !rows.length ||
    rows.length > 100 ||
    rows.some((row) => Object.keys(row).length !== 1 || !Object.hasOwn(row, 'email'))
  )
    throw new Error('Expected only the email column, with 1-100 rows');
  const result = activationInput.parse({ emails: rows.map((row) => row.email) });
  return [...new Set(result.emails)];
}
