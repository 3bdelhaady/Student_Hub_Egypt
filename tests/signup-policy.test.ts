import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSignupKind } from '../src/modules/identity/signup-policy';
import { accountRoleLabel, positionLabel } from '../src/modules/institution/policy';
test('only student, affairs and private sector are public signup kinds', () => {
  assert.equal(parseSignupKind(undefined), 'student');
  for (const kind of ['student', 'student_affairs', 'private_sector'])
    assert.equal(parseSignupKind(kind), kind);
  for (const kind of ['admin', 'Coordinator', 'student_union', 'student_activity', '', null])
    assert.throws(() => parseSignupKind(kind));
});
test('union and activity positions display Coordinator without changing stored positions', () => {
  for (const department of ['student_union', 'student_activity']) {
    assert.equal(accountRoleLabel(department), 'Coordinator');
    for (const position of ['president', 'vice_president', 'member'])
      assert.equal(positionLabel(department, position), 'Coordinator');
  }
  assert.equal(accountRoleLabel('student_affairs'), 'وكيل شؤون الطلاب');
  assert.equal(accountRoleLabel('private_sector'), 'وكيل قطاع خاص');
});
