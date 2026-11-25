import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  activeAgent,
  canReadDomain,
  canEditDomain,
  canEditInstitution,
  canManageOfficers,
  type AgentScope,
} from '../src/modules/institution/policy';
const affairs: AgentScope = {
  isSuperAgent: false,
  institutionId: 'i',
  universityId: 'u',
  facultyId: 'f',
  organizationId: null,
  department: 'student_affairs',
  position: 'representative',
  status: 'active',
  canRead: true,
  canEdit: true,
  canPublish: true,
};
const superAffairs = { ...affairs, isSuperAgent: true };
const officer = {
  ...affairs,
  department: 'student_union',
  organizationId: 'o',
  position: 'president',
};
test('department, institution, university, faculty, organization boundaries are exact', () => {
  assert.equal(canEditDomain(affairs, affairs, true), true);
  for (const [key, value] of Object.entries({
    institutionId: 'other',
    universityId: 'other',
    facultyId: 'other',
    organizationId: 'other',
    department: 'youth_welfare',
  }))
    assert.equal(canReadDomain(affairs, { ...affairs, [key]: value }, true), false, key);
  assert.equal(canReadDomain(officer, { ...officer, organizationId: 'other' }, true), false);
});
test('only student affairs controls own-faculty union/activity officer access', () => {
  assert.equal(canManageOfficers(superAffairs, officer, true), true);
  assert.equal(
    canManageOfficers(superAffairs, { ...officer, department: 'student_activity' }, true),
    true,
  );
  for (const target of [
    { ...officer, facultyId: 'other' },
    { ...officer, institutionId: 'other' },
    { ...officer, universityId: 'other' },
    { ...officer, department: 'youth_welfare' },
    { ...officer, department: 'student_affairs' },
  ])
    assert.equal(canManageOfficers(superAffairs, target, true), false);
  for (const department of ['student_union', 'student_activity', 'private_sector'])
    assert.equal(canManageOfficers({ ...superAffairs, department }, officer, true), false);
  for (const position of ['president', 'vice_president', 'member'])
    assert.equal(canManageOfficers({ ...officer, position }, officer, true), false);
});
test('inactive assignment, no read permission and disabled institutions deny all agent work', () => {
  for (const agent of [
    undefined,
    { ...affairs, status: 'pending' },
    { ...affairs, status: 'suspended' },
    { ...affairs, canRead: false },
  ]) {
    assert.equal(activeAgent(agent, true), false);
    assert.equal(canEditDomain(agent, affairs, true), false);
    assert.equal(canManageOfficers(agent, officer, true), false);
  }
  assert.equal(canReadDomain(affairs, affairs, false), false);
  assert.equal(canEditDomain({ ...affairs, canEdit: false }, affairs, true), false);
});
test('only private-sector agent edits own institution profile', () => {
  assert.equal(canEditInstitution(affairs, 'i', true), false);
  const privateAgent = {
    ...affairs,
    department: 'private_sector',
    universityId: null,
    facultyId: null,
  };
  assert.equal(canEditInstitution(privateAgent, 'i', true), true);
  assert.equal(canEditInstitution(privateAgent, 'other', true), false);
});

test('university super covers both university departments, never private sector or another faculty', () => {
  assert.equal(
    canReadDomain(superAffairs, { ...affairs, department: 'youth_welfare' }, true),
    true,
  );
  assert.equal(
    canReadDomain(
      superAffairs,
      { ...affairs, department: 'private_sector', universityId: null, facultyId: null },
      true,
    ),
    false,
  );
  assert.equal(canReadDomain(superAffairs, { ...affairs, facultyId: 'other' }, true), false);
  assert.equal(canManageOfficers(affairs, officer, true), true);
  assert.equal(canManageOfficers({ ...affairs, canEdit: false }, officer, true), false);
});
