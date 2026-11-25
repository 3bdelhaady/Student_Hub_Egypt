import type { SectionPermissions } from './section-policy';
export type Department =
  'student_affairs' | 'youth_welfare' | 'private_sector' | 'student_union' | 'student_activity';
export type Position = 'representative' | 'president' | 'vice_president' | 'member';
export type AgentScope = {
  institutionId: string;
  universityId: string | null;
  facultyId: string | null;
  organizationId: string | null;
  department: string;
  position: string;
  status: string;
  isSuperAgent?: boolean;
  sectionPermissions?: SectionPermissions | null;
  canRead: boolean;
  canEdit: boolean;
  canPublish: boolean;
};
export type ContentScope = Pick<
  AgentScope,
  'institutionId' | 'universityId' | 'facultyId' | 'organizationId' | 'department'
>;
export function activeAgent(agent: AgentScope | undefined, active: boolean) {
  return !!agent && agent.status === 'active' && agent.canRead && active;
}
export function sameDomain(agent: AgentScope, scope: ContentScope) {
  return (
    agent.institutionId === scope.institutionId &&
    agent.universityId === scope.universityId &&
    agent.facultyId === scope.facultyId &&
    agent.organizationId === scope.organizationId &&
    agent.department === scope.department
  );
}
export function canEditInstitution(
  agent: AgentScope | undefined,
  institutionId: string,
  active: boolean,
) {
  return (
    activeAgent(agent, active) &&
    agent!.canEdit &&
    agent!.department === 'private_sector' &&
    agent!.institutionId === institutionId
  );
}
export function canReadDomain(agent: AgentScope | undefined, scope: ContentScope, active: boolean) {
  return (
    activeAgent(agent, active) &&
    (sameDomain(agent!, scope) ||
      (agent!.isSuperAgent === true &&
        ['student_affairs', 'youth_welfare'].includes(agent!.department) &&
        agent!.institutionId === scope.institutionId &&
        agent!.universityId === scope.universityId &&
        agent!.facultyId === scope.facultyId &&
        scope.department !== 'private_sector'))
  );
}
export function canEditDomain(agent: AgentScope | undefined, scope: ContentScope, active: boolean) {
  return canReadDomain(agent, scope, active) && agent!.canEdit;
}
export function canManageOfficers(
  agent: AgentScope | undefined,
  target: Pick<AgentScope, 'institutionId' | 'universityId' | 'facultyId' | 'department'>,
  active: boolean,
) {
  return (
    activeAgent(agent, active) &&
    agent!.canEdit &&
    (agent!.department === 'student_affairs' ||
      (agent!.isSuperAgent === true && agent!.department === 'youth_welfare')) &&
    agent!.institutionId === target.institutionId &&
    agent!.universityId === target.universityId &&
    agent!.facultyId === target.facultyId &&
    ['student_union', 'student_activity'].includes(target.department)
  );
}
export const departmentLabels: Record<string, string> = {
  student_affairs: 'شؤون الطلاب',
  youth_welfare: 'رعاية الشباب',
  private_sector: 'القطاع الخاص',
  student_union: 'اتحاد الطلاب',
  student_activity: 'نشاط طلابي',
};
export const positionLabels: Record<string, string> = {
  representative: 'وكيل الجهة',
  president: 'رئيس',
  vice_president: 'نائب رئيس',
  member: 'عضو',
};
export const agentStatusLabels: Record<string, string> = {
  pending: 'بانتظار تفعيل أدمن المنصة',
  active: 'مفعّل',
  suspended: 'موقوف',
};
export const institutionKinds: Record<string, string> = {
  university: 'جهة جامعية',
  private_sector: 'قطاع خاص',
};

export function canManageAgents(
  agent: AgentScope | undefined,
  target: ContentScope,
  active: boolean,
) {
  return (
    activeAgent(agent, active) &&
    (canManageOfficers(agent, target, active) ||
      (agent!.isSuperAgent === true && canReadDomain(agent, target, active)))
  );
}

// Storage identifiers stay stable; coordinator is a capability of a student account.
export function isCoordinator(department: string | undefined) {
  return department === 'student_union' || department === 'student_activity';
}
export function accountRoleLabel(department: string | undefined) {
  return isCoordinator(department)
    ? 'Coordinator'
    : department === 'student_affairs'
      ? 'وكيل شؤون الطلاب'
      : department === 'private_sector'
        ? 'وكيل قطاع خاص'
        : 'وكيل الجهة';
}
export function positionLabel(department: string, position: string) {
  return isCoordinator(department) ? 'Coordinator' : positionLabels[position] || position;
}
