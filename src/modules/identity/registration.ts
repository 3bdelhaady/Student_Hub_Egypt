'use server';
import { reportFailure } from '@/lib/diagnostics';
import { db } from '@/db';
import {
  user,
  institutions,
  faculties,
  memberships,
  institutionAgents,
  institutionAuditEvents,
  platformAdmins,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { type FormState, refresh } from '../shared/form-state';

// Requests are pending and grant no dashboard/data access until admin review.
export async function requestAgentRegistration(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  try {
    await db.transaction(async (tx) => {
      const [person] = await tx
        .select()
        .from(user)
        .where(eq(user.id, v.user.id))
        .for('update')
        .limit(1);
      if (!person || !['student_affairs', 'private_sector'].includes(person.signupKind))
        throw Error();
      const [existing] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, person.id))
        .limit(1);
      const [member] = await tx
        .select()
        .from(memberships)
        .where(eq(memberships.userId, person.id))
        .limit(1);
      const [admin] = await tx
        .select()
        .from(platformAdmins)
        .where(eq(platformAdmins.userId, person.id))
        .limit(1);
      if (existing || member || admin) throw Error();
      const universityId = String(form.get('universityId') || '');

      let institution;
      let facultyId: string | null = null;
      if (person.signupKind === 'student_affairs') {
        facultyId = String(form.get('facultyId') || '');
        const [f] = await tx
          .select()
          .from(faculties)
          .where(
            and(
              eq(faculties.id, facultyId),
              eq(faculties.universityId, universityId),
              eq(faculties.active, true),
            ),
          )
          .limit(1);
        [institution] = await tx
          .select()
          .from(institutions)
          .where(
            and(
              eq(institutions.kind, 'university'),
              eq(institutions.universityId, universityId),
              eq(institutions.active, true),
            ),
          )
          .orderBy(institutions.createdAt)
          .limit(1);
        if (!f || !institution) throw Error();
      } else {
        [institution] = await tx
          .select()
          .from(institutions)
          .where(
            and(
              eq(institutions.id, String(form.get('institutionId') || '')),
              eq(institutions.kind, 'private_sector'),
              eq(institutions.active, true),
            ),
          )
          .limit(1);
        if (!institution || form.get('facultyId') || form.get('universityId')) throw Error();
      }
      const id = crypto.randomUUID();
      await tx.insert(institutionAgents).values({
        id,
        userId: person.id,
        institutionId: institution.id,
        universityId: person.signupKind === 'student_affairs' ? universityId : null,
        facultyId,
        organizationId: null,
        department: person.signupKind as 'student_affairs' | 'private_sector',
        position: 'representative',
        status: 'pending',
        canRead: false,
        canEdit: false,
        canPublish: false,
        isSuperAgent: false,
      });
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: person.id,
        institutionId: institution.id,
        action: 'agent.self-registration-requested',
        entityId: id,
      });
    });
    refresh();
    return { success: 'وصل طلبك، وينتظر تفعيل أدمن المنصة وتحديد الصلاحيات.' };
  } catch {
    reportFailure('modules.identity.registration');
    return { error: 'تعذر إرسال الطلب، اختر نطاقًا متاحًا أو تواصل مع الدعم، لا تعِد إنشاء الحساب.' };
  }
}
