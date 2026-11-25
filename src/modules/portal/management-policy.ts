import { agentSections, hasSectionRight, portalSection } from '../institution/section-policy';
import { canReadDomain, type AgentScope, type ContentScope } from '../institution/policy';
export const serviceDepartments = [
  'student_union',
  'student_activity',
  'private_sector',
  'youth_welfare',
];
export function canReadPortal(
  agent: AgentScope | undefined,
  scope: ContentScope & { kind?: string; ticketType?: string },
  active: boolean,
) {
  return (
    !!agent &&
    serviceDepartments.includes(agent.department) &&
    canReadDomain(agent, scope, active) &&
    (!scope.kind ||
      agent.department === 'private_sector' ||
      ((scope.kind in agentSections || ['training', 'trip'].includes(scope.kind)) &&
        scope.kind !== 'academic')) &&
    (!scope.kind
      ? !agent.sectionPermissions
      : hasSectionRight(agent, portalSection(scope.kind, scope.ticketType), 'canRead'))
  );
}
export function canEditPortal(
  agent: AgentScope | undefined,
  scope: ContentScope & { kind?: string; ticketType?: string },
  active: boolean,
) {
  return (
    canReadPortal(agent, scope, active) &&
    !!agent &&
    (!scope.kind
      ? agent.canEdit
      : hasSectionRight(agent, portalSection(scope.kind, scope.ticketType), 'canEdit'))
  );
}
