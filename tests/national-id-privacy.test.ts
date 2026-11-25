import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptNationalId,
  decryptNationalId,
  mayReadNationalId,
} from '../src/modules/identity/national-id-crypto';
test('national IDs encrypt with authenticated randomized ciphertext', () => {
  const secret = 'a'.repeat(48),
    value = '30509172712345';
  const a = encryptNationalId(value, secret),
    b = encryptNationalId(value, secret);
  assert.notEqual(a, b);
  assert.ok(!a.includes(value));
  assert.equal(decryptNationalId(a, secret), value);
  assert.throws(() => decryptNationalId(a, 'b'.repeat(48)));
  const parts = a.split('.');
  parts[3] = Buffer.from('tampered').toString('base64');
  assert.throws(() => decryptNationalId(parts.join('.'), secret));
});
test('only owner or platform admin may read a national ID, never another agent', () => {
  assert.equal(mayReadNationalId({ user: { id: 'owner' }, platformAdmin: false }, 'owner'), true);
  assert.equal(mayReadNationalId({ user: { id: 'admin' }, platformAdmin: true }, 'owner'), true);
  for (const id of ['student-affairs', 'coordinator', 'private-agent', 'other-student'])
    assert.equal(mayReadNationalId({ user: { id }, platformAdmin: false }, 'owner'), false);
});
