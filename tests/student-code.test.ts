import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudentCode, parseGender } from '../src/modules/identity/student-code';
test('account codes encode original role and chosen gender with uppercase alphanumeric unique suffixes', () => {
  for (const [kind, prefix] of [
    ['student', 'ST'],
    ['student_affairs', 'SA'],
    ['private_sector', 'PS'],
    ['admin', 'AD'],
  ]) {
    assert.match(createStudentCode(kind, 'male'), new RegExp('^' + prefix + 'M[A-F0-9]{16}$'));
    assert.match(createStudentCode(kind, 'female'), new RegExp('^' + prefix + 'F[A-F0-9]{16}$'));
    assert.match(createStudentCode(kind, null), new RegExp('^' + prefix + 'X[A-F0-9]{16}$'));
  }
  const codes = Array.from({ length: 1000 }, () => createStudentCode('student', 'male'));
  assert.equal(new Set(codes).size, 1000);
  assert.equal(parseGender('male'), 'male');
  assert.equal(parseGender('female'), 'female');
  assert.equal(parseGender('other'), null);
  assert.throws(() => createStudentCode('coordinator', 'male'));
});
