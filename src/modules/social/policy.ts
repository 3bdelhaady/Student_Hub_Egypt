import type { AgentScope } from '../institution/policy';
import { isCoordinator } from '../institution/policy';
import { hasSectionRight } from '../institution/section-policy';
export const socialChannels = {
  facebook: 'فيسبوك',
  instagram: 'إنستغرام',
  linkedin: 'لينكدإن',
  youtube: 'يوتيوب',
} as const;
export const socialStates: Record<string, string> = {
  pending: 'بانتظار شؤون الطلاب',
  approved: 'مقبول للمراجعة النهائية',
  rejected: 'مرفوض',
  scheduled: 'مجدول داخليًا',
  ready: 'جاهز، غير منشور',
};
export function socialAccess(a: AgentScope | undefined, active: boolean, edit = false) {
  if (!a || !active || a.status !== 'active' || !a.canRead || !a.facultyId || !a.universityId)
    return false;
  if (a.department === 'student_affairs') return !edit || a.canEdit;
  return isCoordinator(a.department) && hasSectionRight(a, 'social', edit ? 'canEdit' : 'canRead');
}
export function sameSocialScope(
  a: AgentScope,
  p: { institutionId: string; universityId: string; facultyId: string },
) {
  return (
    a.institutionId === p.institutionId &&
    a.universityId === p.universityId &&
    a.facultyId === p.facultyId
  );
}
