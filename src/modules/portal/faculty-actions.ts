'use server';
import { reportFailure } from '@/lib/diagnostics';
import { db } from '@/db';
import {
  memberships,
  institutionAgents,
  institutions,
  faculties,
  institutionAuditEvents,
  portalNotifications,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { fail, refresh, type FormState } from '../shared/form-state';
export async function reviewFacultyStudent(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer(),
    id = String(form.get('membershipId') || ''),
    status = form.get('status');
  if ((status !== 'active' && status !== 'suspended') || form.get('confirmed') !== 'on')
    return fail();
  try {
    await db.transaction(async (tx) => {
      const [a] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (
        !a ||
        a.department !== 'student_affairs' ||
        a.status !== 'active' ||
        !a.canRead ||
        !a.canEdit ||
        !a.facultyId ||
        !a.universityId
      )
        throw new Error('forbidden');
      const [i] = await tx
        .select()
        .from(institutions)
        .where(eq(institutions.id, a.institutionId))
        .for('share')
        .limit(1);
      const [f] = await tx
        .select()
        .from(faculties)
        .where(eq(faculties.id, a.facultyId))
        .for('share')
        .limit(1);
      if (
        !i?.active ||
        !f?.active ||
        i.universityId !== a.universityId ||
        f.universityId !== a.universityId
      )
        throw new Error('inactive');
      const [m] = await tx
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.id, id),
            eq(memberships.universityId, a.universityId),
            eq(memberships.facultyId, a.facultyId),
            eq(memberships.role, 'student'),
          ),
        )
        .for('update')
        .limit(1);
      if (!m || m.userId === v.user.id || m.status === status) throw new Error('invalid');
      await tx.update(memberships).set({ status }).where(eq(memberships.id, m.id));
      await tx.insert(portalNotifications).values({
        id: crypto.randomUUID(),
        userId: m.userId,
        title: status === 'active' ? 'تم تفعيل عضويتك الجامعية' : 'تحديث حالة العضوية الجامعية',
        body:
          status === 'active'
            ? 'أصبحت موارد مجتمعك متاحة، افتح مساحتك للاطلاع على المقررات والخدمات.'
            : 'عُلّق الوصول الأكاديمي لعضويتك، يمكنك متابعة التفاصيل مع شؤون الطلاب عبر الدعم.',
        href: '/account?view=student',
      });
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: a.institutionId,
        action: 'student.' + status,
        entityId: m.id,
      });
    });
    refresh();
    return {
      success: status === 'active' ? 'تم تفعيل عضوية الطالب.' : 'تم إيقاف عضوية الطالب الأكاديمية.',
    };
  } catch {
    reportFailure('modules.portal.faculty-actions');
    return {
      error: 'تعذر تغيير الحالة، شؤون الطلاب يدير طلاب كليته فقط، مع صلاحية التعديل وتفعيل الجهة.',
    };
  }
}
