export const agentSections = {
  ticket: 'التذاكر الإلكترونية',
  team: 'الفرق الأكاديمية',
  volunteer: 'التطوع والأنشطة',
  certificate: 'الشهادات والإيفادات',
  service: 'رابط الطلاب',
  poll: 'التصويت والاستبيانات',
  academic: 'مساحة العمل الأكاديمية',
  social: 'إدارة قنوات التواصل',
} as const;
export const storeExtraSections = {
  product: 'المتجر الأكاديمي',
  housing: 'السكن الطلابي',
  restaurant: 'المطاعم والكافيهات',
} as const;
export const permissionSections = { ...agentSections, ...storeExtraSections };
export type AgentSection = keyof typeof permissionSections;
export type SectionRights = { canRead: boolean; canEdit: boolean; canPublish: boolean };
export type SectionPermissions = Partial<Record<AgentSection | 'trip' | 'training', SectionRights>>;
type PermissionAgent = SectionRights & {
  department?: string;
  sectionPermissions?: SectionPermissions | null;
};
export function sectionRights(agent: PermissionAgent | undefined, section: string): SectionRights {
  const denied = { canRead: false, canEdit: false, canPublish: false };
  if (!agent || (agent.department === 'student_activity' && ['academic', 'team'].includes(section)))
    return denied;
  if (!agent.sectionPermissions)
    return section === 'academic' ||
      section === 'social' ||
      !(
        section in agentSections ||
        ['product', 'housing', 'restaurant', 'trip', 'training'].includes(section)
      )
      ? denied
      : agent;
  if (!(section in permissionSections) && !['trip', 'training'].includes(section)) return denied;
  const rights =
    section === 'trip'
      ? agent.sectionPermissions.trip || agent.sectionPermissions.ticket
      : agent.sectionPermissions[section as AgentSection];
  return rights || denied;
}
export function hasSectionRight(
  agent: PermissionAgent | undefined,
  section: string,
  right: keyof SectionRights,
) {
  const rights = sectionRights(agent, section);
  return (
    rights.canRead &&
    (right === 'canRead' || (rights.canEdit && (right === 'canEdit' || rights.canPublish)))
  );
}
export function parseSectionPermissions(form: FormData): SectionPermissions | null {
  if (form.get('sectionPermissionsVersion') !== '1') return null;
  const result = Object.fromEntries(
    Object.keys(permissionSections).map((key) => [
      key,
      {
        canRead: form.get(`${key}.canRead`) === 'on',
        canEdit: form.get(`${key}.canEdit`) === 'on',
        canPublish: form.get(`${key}.canPublish`) === 'on',
      },
    ]),
  );
  return result;
}
export function validSectionPermissions(permissions: SectionPermissions | null) {
  return (
    !permissions ||
    Object.values(permissions).every(
      (p) => (!p.canEdit || p.canRead) && (!p.canPublish || (p.canRead && p.canEdit)),
    )
  );
}
export function aggregateSectionPermissions(permissions: SectionPermissions): SectionRights {
  const rights = Object.values(permissions);
  return {
    canRead: rights.some((p) => p.canRead),
    canEdit: rights.some((p) => p.canEdit),
    canPublish: rights.some((p) => p.canPublish),
  };
}

export function portalSection(kind: string, ticketType?: string) {
  return kind === 'ticket' && ticketType === 'trip' ? 'trip' : kind;
}
