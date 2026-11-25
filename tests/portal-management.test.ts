import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canEditPortal, canReadPortal } from '../src/modules/portal/management-policy';
import {
  canManageOfficers,
  canManageAgents,
  type AgentScope,
} from '../src/modules/institution/policy';
const a: AgentScope = {
  institutionId: 'i',
  universityId: 'u',
  facultyId: 'f',
  organizationId: null,
  department: 'student_affairs',
  position: 'representative',
  status: 'active',
  isSuperAgent: false,
  canRead: true,
  canEdit: true,
  canPublish: true,
};
const union = { ...a, department: 'student_union', organizationId: 'o', position: 'president' };
test('affairs manages own-faculty officer access, not service publishing', () => {
  assert.equal(canManageOfficers(a, union, true), true);
  assert.equal(canManageAgents(a, union, true), true);
  assert.equal(canManageAgents(a, { ...union, facultyId: 'other' }, true), false);
  assert.equal(canEditPortal(a, a, true), false);
  assert.equal(canEditPortal({ ...a, isSuperAgent: true }, union, true), false);
  for (const dept of ['student_union', 'student_activity']) {
    const officer = { ...union, department: dept };
    assert.equal(canEditPortal(officer, officer, true), true);
    assert.equal(canEditPortal(officer, { ...officer, organizationId: 'other' }, true), false);
    assert.equal(canReadPortal({ ...officer, canEdit: false }, officer, true), true);
    assert.equal(canEditPortal({ ...officer, canEdit: false }, officer, true), false);
    assert.equal(canEditPortal({ ...officer, status: 'suspended' }, officer, true), false);
    assert.equal(canEditPortal(officer, officer, false), false);
  }
});

import { isAgentMode } from '../src/modules/identity/mode-policy';
test('agent-only accounts cannot force student view, dual users switch explicitly', () => {
  assert.equal(isAgentMode(null), false);
  assert.equal(isAgentMode({ institutionAgent: {}, activeMode: 'student' }), true);
  assert.equal(
    isAgentMode({ institutionAgent: {}, membership: { role: 'student' }, activeMode: 'agent' }),
    true,
  );
  assert.equal(
    isAgentMode({ institutionAgent: {}, membership: { role: 'student' }, activeMode: 'student' }),
    false,
  );
});
