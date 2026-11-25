import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  personalCourseInput,
  personalResourceInput,
  personalProgress,
} from '../src/modules/personal-learning/policy';
import { studentReturnPath } from '../src/modules/shared/return-path';
test('private learning validates HTTPS resources or a nonempty personal note', () => {
  assert.equal(
    personalResourceInput.safeParse({ title: 'مورد', body: '', url: '' }).success,
    false,
  );
  assert.equal(
    personalResourceInput.safeParse({ title: 'مورد', body: 'ملاحظة', url: '' }).success,
    true,
  );
  for (const url of [
    'javascript:alert(1)',
    'http://example.com',
    '//example.com',
    'data:text/html,a',
    'https://user:password@example.com',
  ])
    assert.equal(personalResourceInput.safeParse({ title: 'مورد', body: '', url }).success, false);
  assert.equal(
    personalResourceInput.parse({ title: ' مورد ', url: 'https://example.com', body: '' }).url,
    'https://example.com/',
  );
});
test('private course state and actual zero-safe progress are bounded', () => {
  assert.equal(
    personalCourseInput.safeParse({ title: 'دورتي', description: '', status: 'published' }).success,
    false,
  );
  assert.equal(
    personalCourseInput.safeParse({ title: 'دورتي', description: '', status: 'draft' }).success,
    true,
  );
  assert.equal(personalProgress(0, 0), 0);
  assert.equal(personalProgress(1, 3), 33);
  assert.equal(personalProgress(9, 3), 100);
  assert.equal(personalProgress(-1, 3), 0);
});
test('private learning keeps allowed sign-in returns without allowing outside callbacks', () => {
  assert.equal(studentReturnPath('/learning/new'), '/learning/new');
  assert.equal(studentReturnPath('/learning/abc-123'), '/learning/abc-123');
  assert.equal(studentReturnPath('/learning//evil.example'), '/account');
});
