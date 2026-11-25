import test from 'node:test';
import assert from 'node:assert/strict';
import { canStudentReadEntry } from '../src/modules/portal/policy';
test('university poll widens voter audience only within same university; faculty poll remains local', () => {
  const e = {
    universityId: 'u',
    facultyId: 'f1',
    department: 'student_union',
    kind: 'poll',
    published: true,
    pollAudience: 'university',
  };
  assert.equal(
    canStudentReadEntry({ status: 'active', universityId: 'u', facultyId: 'f2' }, e, true),
    true,
  );
  assert.equal(
    canStudentReadEntry({ status: 'active', universityId: 'other', facultyId: 'f2' }, e, true),
    false,
  );
  assert.equal(
    canStudentReadEntry({ status: 'pending', universityId: 'u', facultyId: 'f2' }, e, true),
    false,
  );
  assert.equal(
    canStudentReadEntry(
      { status: 'active', universityId: 'u', facultyId: 'f2' },
      { ...e, pollAudience: 'faculty' },
      true,
    ),
    false,
  );
});
