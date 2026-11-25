import { test } from 'node:test';
import assert from 'node:assert/strict';
import { socialAccess, sameSocialScope } from '../src/modules/social/policy';
import { sectionRights } from '../src/modules/institution/section-policy';
const a = {
  institutionId: 'i',
  universityId: 'u',
  facultyId: 'f',
  organizationId: 'o',
  department: 'student_union',
  position: 'member',
  status: 'active',
  canRead: true,
  canEdit: true,
  canPublish: true,
  sectionPermissions: { social: { canRead: true, canEdit: true, canPublish: false } },
};
test('social service needs explicit Coordinator grant, active scope and same faculty affairs', () => {
  assert.equal(socialAccess(a, true, true), true);
  assert.equal(socialAccess({ ...a, sectionPermissions: null }, true), false);
  assert.equal(sectionRights({ ...a, sectionPermissions: null }, 'social').canRead, false);
  assert.equal(socialAccess({ ...a, status: 'suspended' }, true), false);
  assert.equal(socialAccess(a, false), false);
  assert.equal(socialAccess({ ...a, department: 'private_sector' }, true), false);
  assert.equal(
    socialAccess({ ...a, department: 'student_affairs', canEdit: false }, true, true),
    false,
  );
  assert.equal(socialAccess({ ...a, department: 'student_affairs' }, true, true), true);
  assert.equal(
    sameSocialScope(a, { institutionId: 'i', universityId: 'u', facultyId: 'other' }),
    false,
  );
  assert.equal(sameSocialScope(a, { institutionId: 'i', universityId: 'u', facultyId: 'f' }), true);
});
