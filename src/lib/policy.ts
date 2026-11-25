export type Membership = { role: string; status: string; universityId: string };
export function canReadAcademic(m: Membership | undefined, universityId: string) {
  return !!m && m.status === 'active' && m.universityId === universityId;
}
export function canManageContent(m: Membership | undefined, universityId: string) {
  return canReadAcademic(m, universityId) && (m?.role === 'admin' || m?.role === 'editor');
}
export function canManageMembers(m: Membership | undefined, universityId: string) {
  return canReadAcademic(m, universityId) && m?.role === 'admin';
}
