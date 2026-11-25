export const entryKinds = [
  'product',
  'housing',
  'restaurant',
  'ticket',
  'team',
  'volunteer',
  'certificate',
  'service',
  'poll',
] as const;
export type EntryKind = (typeof entryKinds)[number];
export const entryLabels: Record<string, string> = {
  product: 'المتجر الأكاديمي',
  housing: 'السكن الطلابي',
  restaurant: 'المطاعم والكافيهات',
  ticket: 'التذاكر الإلكترونية',
  team: 'الفرق الأكاديمية',
  volunteer: 'التطوع والأنشطة',
  certificate: 'الشهادات والإيفادات',
  service: 'رابط الطلاب',
  poll: 'التصويت والاستبيانات',
};
export const requestLabels: Record<string, string> = {
  ...entryLabels,
  trip: 'تذكرة رحلة، طلب سابق',
  training: 'دورة تدريبية مؤرشفة',
  support: 'الدعم الفني',
  team_creation: 'طلب إنشاء فريق أكاديمي',
};
export const requestStatuses: Record<string, string> = {
  pending: 'قيد المراجعة',
  reviewing: 'جارٍ المتابعة',
  accepted: 'مقبول',
  completed: 'مكتمل',
};
export const commerceKinds = ['product', 'housing', 'restaurant', 'ticket'];
export function safeMediaUrl(value: string) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(u.hostname)
    );
  } catch {
    return false;
  }
}
export function canStudentReadEntry(
  m: { status: string; universityId: string; facultyId: string | null } | undefined,
  e: {
    universityId: string | null;
    facultyId: string | null;
    kind?: string;
    pollAudience?: string;
    demo?: boolean;
    title?: string;
    description?: string;
    department: string;
    published: boolean;
    archived?: boolean;
  },
  active: boolean,
) {
  if (
    e.archived ||
    !e.published ||
    !active ||
    (process.env.VERCEL &&
      (e.demo ||
        /^ديمو[:：]|^بيانات (?:تجريبية|وهمية)/u.test(e.title || '') ||
        /^بيانات (?:تجريبية|وهمية)/u.test(e.description || '')))
  )
    return false;
  if (e.department === 'private_sector' && !e.universityId) return true;
  return (
    !!m &&
    m.status === 'active' &&
    m.universityId === e.universityId &&
    (!e.facultyId ||
      m.facultyId === e.facultyId ||
      (e.kind === 'poll' && e.pollAudience === 'university') ||
      (e.kind === 'volunteer' && e.department === 'student_activity'))
  );
}
export function validRequestTransition(current: string, next: string) {
  const allowed: Record<string, string[]> = {
    pending: ['reviewing', 'accepted', 'completed'],
    reviewing: ['accepted', 'completed'],
    accepted: ['completed'],
    rejected: [],
    completed: [],
    cancelled: [],
  };
  return allowed[current]?.includes(next) || false;
}

export { cairoDate } from '../shared/datetime';
