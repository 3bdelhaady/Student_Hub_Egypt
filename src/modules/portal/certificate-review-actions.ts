'use server';
import { reportFailure } from '@/lib/diagnostics';
import { db } from '@/db';
import {
  certificateChanges,
  certificateRecords,
  institutionAgents,
  institutionAuditEvents,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { activeEntryScope } from './queries';
import { canEditPortal } from './management-policy';
import { refresh, type FormState } from '../shared/form-state';
export async function reviewCertificateChange(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  try {
    if (
      form.get('confirm') !== 'on' ||
      !['approve', 'reject'].includes(String(form.get('decision')))
    )
      throw Error();
    await db.transaction(async (tx) => {
      const [change] = await tx
        .select()
        .from(certificateChanges)
        .where(eq(certificateChanges.id, String(form.get('id') || '')))
        .for('update')
        .limit(1);
      const [reviewer] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (
        !change ||
        change.status !== 'pending' ||
        !reviewer ||
        reviewer.department !== 'student_affairs' ||
        reviewer.status !== 'active' ||
        !reviewer.canRead ||
        !reviewer.canEdit ||
        !reviewer.facultyId ||
        reviewer.universityId !== change.universityId ||
        reviewer.facultyId !== change.facultyId ||
        !(await activeEntryScope(reviewer, tx)) ||
        !(await activeEntryScope(change, tx))
      )
        throw Error('scope');
      const approving = form.get('decision') === 'approve';
      if (approving) {
        const [author] = await tx
          .select()
          .from(institutionAgents)
          .where(eq(institutionAgents.userId, change.authorId))
          .for('share')
          .limit(1);
        if (
          !author ||
          !['student_union', 'student_activity'].includes(author.department) ||
          !canEditPortal(
            author,
            { ...change, kind: 'certificate' },
            await activeEntryScope(change, tx),
          )
        )
          throw Error('author no longer authorized');
        const data = {
          recipientName: change.recipientName,
          certificateTitle: change.certificateTitle,
          issuedOn: change.issuedOn,
          published: true,
          updatedAt: new Date(),
        };
        let entityId = change.recordId;
        if (entityId) {
          const [old] = await tx
            .select()
            .from(certificateRecords)
            .where(eq(certificateRecords.id, entityId))
            .for('update')
            .limit(1);
          if (
            !old ||
            old.deleted ||
            old.serial !== change.serial ||
            old.updatedAt.getTime() !== change.baseUpdatedAt?.getTime() ||
            old.institutionId !== change.institutionId ||
            old.facultyId !== change.facultyId ||
            old.organizationId !== change.organizationId ||
            old.department !== change.department
          )
            throw Error('stale');
          await tx.update(certificateRecords).set(data).where(eq(certificateRecords.id, entityId));
        } else {
          entityId = crypto.randomUUID();
          await tx.insert(certificateRecords).values({
            ...data,
            id: entityId,
            serial: change.serial,
            institutionId: change.institutionId,
            universityId: change.universityId,
            facultyId: change.facultyId,
            organizationId: change.organizationId,
            department: change.department,
            authorId: change.authorId,
          });
        }
      }
      await tx
        .update(certificateChanges)
        .set({
          status: approving ? 'approved' : 'rejected',
          reviewerId: v.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(certificateChanges.id, change.id));
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: change.institutionId,
        entityId: change.id,
        action: approving ? 'certificate.change_approved' : 'certificate.change_rejected',
      });
    });
    refresh();
    return {
      success:
        form.get('decision') === 'approve'
          ? 'تمت الموافقة وتحديث سجل الشهادة وإتاحته للتحقق.'
          : 'تم رفض التعديل دون تغيير سجل الشهادة.',
    };
  } catch {
    reportFailure('modules.portal.certificate-review-actions');
    return { error: 'تعذرت المراجعة، تحقق من النطاق والتأكيد وأن الطلب لم يتغير أو يراجع من قبل.' };
  }
}
