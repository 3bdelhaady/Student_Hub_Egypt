import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canStudentReadEntry } from '../src/modules/portal/policy';
const member = { status: 'active', universityId: 'u', facultyId: 'f1' };
const entry = {
  kind: 'volunteer',
  universityId: 'u',
  facultyId: 'f2',
  department: 'student_activity',
  published: true,
};
test('volunteering shares activities across faculties but restricts unions to own faculty', () => {
  assert.equal(canStudentReadEntry(member, entry, true), true);
  assert.equal(canStudentReadEntry(member, { ...entry, department: 'student_union' }, true), false);
  for (const patch of [
    { universityId: 'other' },
    { published: false },
    { archived: true },
    { kind: 'ticket' },
    { department: 'student_affairs' },
  ])
    assert.equal(canStudentReadEntry(member, { ...entry, ...patch }, true), false);
  assert.equal(canStudentReadEntry({ ...member, status: 'pending' }, entry, true), false);
  assert.equal(canStudentReadEntry(member, entry, false), false);
});
