import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseActivationCsv, activationInput } from '../src/lib/activation-input';
test('CSV accepts only normalized email rows and deduplicates', () => {
  assert.deepEqual(parseActivationCsv('email\nSTUDENT@example.test\nstudent@example.test\n'), [
    'student@example.test',
  ]);
});
test('CSV rejects extra columns, malformed values, empty and oversized batches', () => {
  for (const input of [
    'email,national_id\na@b.test,123\n',
    'email\nnot-an-email\n',
    'email\n',
    'email\n' + Array(101).fill('a@b.test').join('\n'),
  ])
    assert.throws(() => parseActivationCsv(input));
});
test('API rejects client scope and role overrides', () => {
  assert.equal(
    activationInput.safeParse({ emails: ['a@b.test'], universityId: 'other' }).success,
    false,
  );
  assert.equal(activationInput.safeParse({ emails: ['a@b.test'], role: 'admin' }).success, false);
});
