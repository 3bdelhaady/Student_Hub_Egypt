import { test } from 'node:test';
import assert from 'node:assert/strict';
import { studentReturnPath, studentLoginPath } from '../src/modules/shared/return-path';
test('authentication returns only to allowlisted student pages', () => {
  for (const p of [
    '/requests/abc-123',
    '/store?saved=1',
    '/help?topic=activation#contact',
    '/fitness/connect?state=valid_state_123456',
  ])
    assert.equal(studentReturnPath(p), p);
  for (const p of [
    undefined,
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/admin',
    '/api/fitness/grant',
    '/login?next=//evil.example',
    '/store/../../admin',
    '/store/%2f%2fevil.example',
    '/requests/abc\n//evil.example',
  ])
    assert.equal(studentReturnPath(p), '/account');
  assert.equal(studentLoginPath('/requests/abc'), '/login?next=%2Frequests%2Fabc');
});
