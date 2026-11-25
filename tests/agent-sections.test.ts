import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  agentSections,
  hasSectionRight,
  parseSectionPermissions,
  validSectionPermissions,
  aggregateSectionPermissions,
} from '../src/modules/institution/section-policy';
import { canReadPortal, canEditPortal } from '../src/modules/portal/management-policy';
const base = {
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
};
test('eight named sections preserve legacy rights without silently changing an account', () => {
  assert.equal(Object.keys(agentSections).length, 8);
  assert.equal(agentSections.service, 'رابط الطلاب');
  assert.equal(hasSectionRight(base, 'ticket', 'canPublish'), true);
  assert.equal(hasSectionRight(base, 'academic', 'canEdit'), false);
});
test('section rights are independent and absent entries deny access even for a super agent', () => {
  const agent = {
    ...base,
    isSuperAgent: true,
    sectionPermissions: {
      ticket: { canRead: true, canEdit: true, canPublish: false },
      trip: { canRead: true, canEdit: false, canPublish: false },
    },
  };
  assert.equal(canReadPortal(agent, { ...base, kind: 'ticket' }, true), true);
  assert.equal(canEditPortal(agent, { ...base, kind: 'ticket' }, true), true);
  assert.equal(hasSectionRight(agent, 'ticket', 'canPublish'), false);
  assert.equal(canReadPortal(agent, { ...base, kind: 'ticket', ticketType: 'trip' }, true), true);
  assert.equal(canEditPortal(agent, { ...base, kind: 'ticket', ticketType: 'trip' }, true), false);
  assert.equal(canReadPortal(agent, { ...base, kind: 'training' }, true), false);
  assert.equal(canEditPortal(agent, { ...base, kind: 'training' }, true), false);
  assert.equal(hasSectionRight(agent, 'academic', 'canRead'), false);
  assert.equal(
    canReadPortal(agent, { ...base, kind: 'ticket', facultyId: 'elsewhere' }, true),
    false,
  );
  assert.equal(
    canReadPortal({ ...agent, status: 'pending' }, { ...base, kind: 'ticket' }, true),
    false,
  );
  assert.equal(canReadPortal(agent, { ...base, kind: 'ticket' }, false), false);
});
test('invalid edit and publish combinations fail closed per section', () => {
  const form = new FormData();
  form.set('sectionPermissionsVersion', '1');
  form.set('poll.canPublish', 'on');
  const invalid = parseSectionPermissions(form);
  assert.equal(validSectionPermissions(invalid), false);
  assert.equal(
    hasSectionRight({ ...base, sectionPermissions: invalid }, 'poll', 'canPublish'),
    false,
  );
  form.set('poll.canRead', 'on');
  form.set('poll.canEdit', 'on');
  const valid = parseSectionPermissions(form)!;
  assert.equal(validSectionPermissions(valid), true);
  assert.equal(Object.keys(valid).length, 11);
  assert.deepEqual(aggregateSectionPermissions(valid), {
    canRead: true,
    canEdit: true,
    canPublish: true,
  });
  form.delete('poll.canPublish');
  form.delete('poll.canEdit');
  form.delete('poll.canRead');
  assert.deepEqual(aggregateSectionPermissions(parseSectionPermissions(form)!), {
    canRead: false,
    canEdit: false,
    canPublish: false,
  });
});
test('union and activity cannot forge student commerce categories', () => {
  for (const department of ['student_union', 'student_activity']) {
    const a = { ...base, department };
    for (const kind of ['product', 'housing', 'restaurant', 'academic'])
      assert.equal(canEditPortal(a, { ...a, kind }, true), false);
  }
});

test('explicit private store grant covers four commerce kinds without core or cross-provider rights', () => {
  const kinds = ['product', 'housing', 'restaurant', 'ticket'];
  const store = {
    ...base,
    department: 'private_sector',
    universityId: null,
    facultyId: null,
    organizationId: null,
    sectionPermissions: Object.fromEntries(
      kinds.map((k) => [k, { canRead: true, canEdit: true, canPublish: true }]),
    ),
  };
  for (const kind of kinds) assert.equal(canEditPortal(store, { ...store, kind }, true), true);
  for (const kind of ['service', 'certificate', 'team', 'volunteer', 'poll', 'academic'])
    assert.equal(canReadPortal(store, { ...store, kind }, true), false);
  assert.equal(
    canEditPortal(store, { ...store, kind: 'product', institutionId: 'other' }, true),
    false,
  );
});

test('legacy trip-only scopes cannot access concerts and new ticket scopes cover both subtypes', () => {
  const legacy = {
    ...base,
    sectionPermissions: { trip: { canRead: true, canEdit: true, canPublish: true } },
  };
  assert.equal(canEditPortal(legacy, { ...base, kind: 'ticket', ticketType: 'trip' }, true), true);
  assert.equal(
    canEditPortal(legacy, { ...base, kind: 'ticket', ticketType: 'concert' }, true),
    false,
  );
  const current = {
    ...base,
    sectionPermissions: { ticket: { canRead: true, canEdit: true, canPublish: true } },
  };
  for (const ticketType of ['concert', 'trip'])
    assert.equal(canEditPortal(current, { ...base, kind: 'ticket', ticketType }, true), true);
});
