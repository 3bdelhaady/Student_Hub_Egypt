import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  volunteerDivisionsInput,
  volunteerApplicationInput,
  volunteerApplicationsOpen,
} from '../src/modules/volunteering/policy';
test('volunteer divisions have unique real labels and stable distinct IDs', () => {
  const row = { id: 'a', label: 'قسم محلي', description: '', active: true };
  assert.equal(volunteerDivisionsInput.safeParse([row]).success, true);
  assert.equal(
    volunteerDivisionsInput.safeParse([
      { ...row, label: 'Local' },
      { ...row, id: 'b', label: 'local' },
    ]).success,
    false,
  );
  assert.equal(
    volunteerDivisionsInput.safeParse([row, { ...row, label: 'قسم مختلف' }]).success,
    false,
  );
  assert.equal(volunteerDivisionsInput.safeParse([{ ...row, label: ' ' }]).success, false);
  assert.equal(
    volunteerDivisionsInput.safeParse(
      Array.from({ length: 21 }, (_, i) => ({ ...row, id: String(i), label: 'قسم ' + i })),
    ).success,
    false,
  );
});
test('volunteer applications require an explicit division and disclosure consent', () => {
  const form = { entryId: 'entry', divisionId: 'division', notes: '', applicationConsent: 'on' };
  assert.equal(volunteerApplicationInput.safeParse(form).success, true);
  for (const patch of [
    { divisionId: '' },
    { entryId: '' },
    { applicationConsent: '' },
    { notes: 'a'.repeat(3001) },
  ])
    assert.equal(volunteerApplicationInput.safeParse({ ...form, ...patch }).success, false);
});
test('volunteer application closure follows real remaining capacity and deadline', () => {
  const now = new Date('2026-11-22T08:00:00Z');
  assert.equal(volunteerApplicationsOpen({ capacity: null, closesAt: null }, now), true);
  assert.equal(volunteerApplicationsOpen({ capacity: 0, closesAt: null }, now), false);
  assert.equal(volunteerApplicationsOpen({ capacity: 3, closesAt: now }, now), false);
  assert.equal(volunteerApplicationsOpen({ capacity: 3, closesAt: new Date(+now + 1) }, now), true);
});

import { volunteerOrganizationInScope } from '../src/modules/volunteering/policy';
test('volunteering allows only own faculty union but all university activities', () => {
  const m = { status: 'active', universityId: 'u', facultyId: 'f' };
  assert.equal(
    volunteerOrganizationInScope(m, { kind: 'student_union', universityId: 'u', facultyId: 'f' }),
    true,
  );
  assert.equal(
    volunteerOrganizationInScope(m, {
      kind: 'student_union',
      universityId: 'u',
      facultyId: 'other',
    }),
    false,
  );
  assert.equal(
    volunteerOrganizationInScope(m, {
      kind: 'student_activity',
      universityId: 'u',
      facultyId: 'other',
    }),
    true,
  );
  assert.equal(
    volunteerOrganizationInScope(m, {
      kind: 'student_activity',
      universityId: 'foreign',
      facultyId: 'f',
    }),
    false,
  );
});
