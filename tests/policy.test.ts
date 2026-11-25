import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canReadAcademic, canManageContent, canManageMembers } from '../src/lib/policy';
const member = { role: 'student', status: 'active', universityId: 'a' };
test('guest and inactive students cannot read resources', () => {
  assert.equal(canReadAcademic(undefined, 'a'), false);
  for (const status of ['pending', 'rejected', 'suspended'])
    assert.equal(canReadAcademic({ ...member, status }, 'a'), false);
});
test('student access stays within university', () => {
  assert.equal(canReadAcademic(member, 'a'), true);
  assert.equal(canReadAcademic(member, 'b'), false);
});
test('students cannot manage content or members', () => {
  assert.equal(canManageContent(member, 'a'), false);
  assert.equal(canManageMembers(member, 'a'), false);
});
test('editor manages content but not membership', () => {
  const editor = { ...member, role: 'editor' };
  assert.equal(canManageContent(editor, 'a'), true);
  assert.equal(canManageMembers(editor, 'a'), false);
  assert.equal(canManageContent(editor, 'b'), false);
});
test('admin is scoped and active', () => {
  const admin = { ...member, role: 'admin' };
  assert.equal(canManageMembers(admin, 'a'), true);
  assert.equal(canManageMembers(admin, 'b'), false);
  assert.equal(canManageMembers({ ...admin, status: 'suspended' }, 'a'), false);
});
