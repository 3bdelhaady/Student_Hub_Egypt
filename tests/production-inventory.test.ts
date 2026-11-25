import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canStudentReadEntry } from '../src/modules/portal/policy';
test('hosted production hides synthetic inventory, including direct links', () => {
  const old = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    const e = {
      department: 'private_sector',
      universityId: null,
      facultyId: null,
      published: true,
      demo: true,
    };
    assert.equal(canStudentReadEntry(undefined, e, true), false);
    assert.equal(canStudentReadEntry(undefined, { ...e, demo: false }, true), true);
    assert.equal(
      canStudentReadEntry(undefined, { ...e, demo: false, title: 'ديمو: سلعة' }, true),
      false,
    );
    assert.equal(
      canStudentReadEntry(
        undefined,
        { ...e, demo: false, description: 'بيانات تجريبية مؤقتة' },
        true,
      ),
      false,
    );
  } finally {
    if (old === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = old;
  }
});
