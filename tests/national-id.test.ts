import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNationalId, nationalIdFingerprint } from '../src/modules/identity/national-id';
test('national identity format accepts normalized digits and real calendar dates, not malformed or future values', () => {
  const sample = '29901018800001';
  assert.equal(normalizeNationalId(sample), sample);
  assert.equal(normalizeNationalId('٢٩٩٠١٠١٨٨٠٠٠٠١'), sample);
  for (const n of [
    '',
    null,
    '29902318800001',
    '29913018800001',
    '29901010000001',
    '39901018800001',
    '19901018800001',
    '2990101880000x',
  ])
    assert.equal(normalizeNationalId(n), null);
});
test('private identity fingerprints are keyed and separated from the original value', () => {
  const id = '29901018800001',
    a = nationalIdFingerprint(id, 'first-private-key');
  assert.match(a, /^[a-f0-9]{64}$/);
  assert.equal(a, nationalIdFingerprint(id, 'first-private-key'));
  assert.notEqual(a, nationalIdFingerprint(id, 'second-private-key'));
  assert.ok(!a.includes(id));
});
