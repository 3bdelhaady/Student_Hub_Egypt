import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canStudentReadEntry,
  validRequestTransition,
  safeMediaUrl,
  cairoDate,
} from '../src/modules/portal/policy';
const e = { universityId: 'u', facultyId: 'f', department: 'student_affairs', published: true };
test('portal content is faculty-bound, published and active', () => {
  assert.equal(
    canStudentReadEntry({ status: 'active', universityId: 'u', facultyId: 'f' }, e, true),
    true,
  );
  assert.equal(
    canStudentReadEntry({ status: 'active', universityId: 'u', facultyId: 'g' }, e, true),
    false,
  );
  assert.equal(
    canStudentReadEntry({ status: 'suspended', universityId: 'u', facultyId: 'f' }, e, true),
    false,
  );
  assert.equal(canStudentReadEntry(undefined, e, true), false);
  assert.equal(
    canStudentReadEntry(
      { status: 'active', universityId: 'u', facultyId: 'f' },
      { ...e, published: false },
      true,
    ),
    false,
  );
  assert.equal(
    canStudentReadEntry({ status: 'active', universityId: 'u', facultyId: 'f' }, e, false),
    false,
  );
  assert.equal(
    canStudentReadEntry(
      undefined,
      { ...e, universityId: null, facultyId: null, department: 'private_sector' },
      true,
    ),
    true,
  );
});
test('request state machine cannot reopen terminal requests or skip approval', () => {
  assert.equal(validRequestTransition('pending', 'accepted'), true);
  assert.equal(validRequestTransition('accepted', 'completed'), true);
  assert.equal(validRequestTransition('pending', 'completed'), true);
  assert.equal(validRequestTransition('completed', 'accepted'), false);
  assert.equal(validRequestTransition('cancelled', 'reviewing'), false);
});
test('media permits only HTTPS without embedded credentials', () => {
  for (const x of [
    'javascript:alert(1)',
    'data:text/html,hi',
    'http://example.com/a',
    'https://user:pass@example.com/a',
    'https://localhost/a',
  ])
    assert.equal(safeMediaUrl(x), false);
  assert.equal(safeMediaUrl('https://example.com/photo.jpg'), true);
  assert.equal(safeMediaUrl(''), true);
});
test('dates use Cairo timezone in winter and summer, not the host timezone', () => {
  assert.equal(cairoDate('2026-11-22T12:00')?.toISOString(), '2026-11-22T10:00:00.000Z');
  assert.equal(cairoDate('2026-07-22T12:00')?.toISOString(), '2026-07-22T09:00:00.000Z');
  assert.throws(() => cairoDate('2026-02-31T12:00'));
  assert.equal(cairoDate(''), null);
});
