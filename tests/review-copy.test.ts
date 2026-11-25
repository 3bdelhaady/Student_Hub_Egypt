import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reviewCopy } from '../scripts/lib/review-copy';
test('seeded catalog copy stays professional and migration preserves operational state', () => {
  assert.equal(Object.keys(reviewCopy).length, 9);
  for (const copy of Object.values(reviewCopy)) {
    assert.doesNotMatch(JSON.stringify(copy), /ديمو|وهمي|تجريب|لا مطعم|لا دفع|قابل للإزالة/);
    for (const value of Object.values(copy)) assert.ok(value.length > 1);
  }
  const migration = fs.readFileSync('migrations/0053_realistic_review_copy.sql', 'utf8');
  assert.doesNotMatch(
    migration,
    /(?:DELETE|INSERT|DROP|TRUNCATE)\s|(?:published|archived|active|price_minor)\s*=/i,
  );
  const updates = migration.split(';').filter((s) => s.trim());
  assert.equal(updates.length, 16);
  for (const statement of updates) assert.match(statement, /WHERE id='review-demo-/);
});
