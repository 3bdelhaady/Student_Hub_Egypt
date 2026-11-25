'use server';
import { reportFailure } from '@/lib/diagnostics';
import { db } from '@/db';
import { redirect } from 'next/navigation';
import {
  certificateRecords,
  certificateChanges,
  certificateLookupAttempts,
  institutionAgents,
  institutionAuditEvents,
  institutions,
  user,
} from '@/db/schema';
import { requireViewer, requireStudentViewer } from '@/lib/session';
import { and, eq, sql } from 'drizzle-orm';
import { activeEntryScope } from './queries';
import { canReadPortal, canEditPortal } from './management-policy';
import { hasSectionRight } from '../institution/section-policy';
import { resolveScope, type Tx } from '../institution/service';
import { certificateInput, parseCertificateCsv, serialInput } from './certificates-policy';
import { refresh } from '../shared/form-state';
import type { Department, ContentScope } from '../institution/policy';
export type CertificateState = {
  error?: string;
  success?: string;
  result?: {
    recipientName: string;
    certificateTitle: string;
    issuedOn: string;
    issuer: string;
    serial: string;
  };
};
async function authority(
  tx: Tx,
  v: Awaited<ReturnType<typeof requireViewer>>,
  scope: ContentScope,
  edit = false,
  publishing = false,
) {
  if (v.platformAdmin) return;
  const [a] = await tx
    .select()
    .from(institutionAgents)
    .where(eq(institutionAgents.userId, v.user.id))
    .for('share')
    .limit(1);
  const active = await activeEntryScope(scope, tx);
  if (
    !(edit
      ? canEditPortal(a, { ...scope, kind: 'certificate' }, active)
      : canReadPortal(a, { ...scope, kind: 'certificate' }, active)) ||
    (publishing && !hasSectionRight(a, 'certificate', 'canPublish'))
  )
    throw new Error('forbidden');
}
export async function saveCertificate(
  _: CertificateState,
  form: FormData,
): Promise<CertificateState> {
  const v = await requireViewer();
  try {
    const input = certificateInput.parse({
      serial: String(form.get('serial') || ''),
      recipientName: String(form.get('recipientName') || ''),
      certificateTitle: String(form.get('certificateTitle') || ''),
      issuedOn: String(form.get('issuedOn') || ''),
    });
    const id = String(form.get('id') || '');
    await db.transaction(async (tx) => {
      const [old] = id
        ? await tx
            .select()
            .from(certificateRecords)
            .where(eq(certificateRecords.id, id))
            .for('update')
            .limit(1)
        : [];
      if (id && (!old || old.deleted)) throw new Error('missing');
      const scope =
        old ||
        (
          await resolveScope(tx, {
            institutionId: String(form.get('institutionId') || ''),
            facultyId: String(form.get('facultyId') || ''),
            organizationId: String(form.get('organizationId') || ''),
            department: String(form.get('department') || '') as Department,
          })
        ).scope;
      const published = form.get('published') === 'on';
      await authority(
        tx,
        v,
        scope,
        true,
        !(
          !v.platformAdmin &&
          ['student_union', 'student_activity'].includes(v.institutionAgent?.department || '')
        ) &&
          (published || !!old?.published),
      );
      if (!(await activeEntryScope(scope, tx))) throw new Error('inactive');
      const serial =
        old?.serial ||
        input.serial ||
        'CERT-' + crypto.randomUUID().replaceAll('-', '').toUpperCase();
      if (old && input.serial !== old.serial) throw new Error('serial immutable');
      const data = {
        recipientName: input.recipientName,
        certificateTitle: input.certificateTitle,
        issuedOn: input.issuedOn,
        published,
        updatedAt: new Date(),
      };
      const entityId = id || crypto.randomUUID();
      const needsReview =
        !v.platformAdmin && ['student_union', 'student_activity'].includes(scope.department);
      if (needsReview) {
        const [collision] = await tx
          .select({ id: certificateRecords.id })
          .from(certificateRecords)
          .where(eq(certificateRecords.serial, serial))
          .limit(1);
        if (collision && collision.id !== id) throw new Error('serial collision');
        await tx.insert(certificateChanges).values({
          ...scope,
          id: crypto.randomUUID(),
          recordId: old?.id || null,
          serial,
          recipientName: input.recipientName,
          certificateTitle: input.certificateTitle,
          issuedOn: input.issuedOn,
          authorId: v.user.id,
          baseUpdatedAt: old?.updatedAt || null,
        });
      } else if (old)
        await tx.update(certificateRecords).set(data).where(eq(certificateRecords.id, id));
      else
        await tx
          .insert(certificateRecords)
          .values({ ...data, ...scope, serial, id: entityId, authorId: v.user.id });
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: scope.institutionId,
        action: needsReview
          ? 'certificate.change_submitted'
          : old
            ? 'certificate.updated'
            : 'certificate.created',
        entityId,
      });
    });
    refresh();
    return {
      success:
        !v.platformAdmin &&
        ['student_union', 'student_activity'].includes(v.institutionAgent?.department || '')
          ? 'تم إرسال بيانات الشهادة لموافقة شؤون الطلاب، السجل الموثق لا يتغير حتى الموافقة.'
          : 'تم حفظ سجل الشهادة، النشر يتيح التحقق باستخدام السيريال.',
    };
  } catch {
    reportFailure('modules.portal.certificates-actions');
    return {
      error: 'تعذر الحفظ، راجع الحقول والنطاق والصلاحيات، السيريال فريد ولا يتغير بعد إنشاء السجل.',
    };
  }
}
export async function importCertificates(
  _: CertificateState,
  form: FormData,
): Promise<CertificateState> {
  const v = await requireViewer();
  try {
    if (form.get('confirmed') !== 'on') throw new Error('confirm');
    const rows = parseCertificateCsv(String(form.get('csv') || ''));
    await db.transaction(async (tx) => {
      const { scope } = await resolveScope(tx, {
        institutionId: String(form.get('institutionId') || ''),
        facultyId: String(form.get('facultyId') || ''),
        organizationId: String(form.get('organizationId') || ''),
        department: String(form.get('department') || '') as Department,
      });
      const published = form.get('published') === 'on';
      await authority(tx, v, scope, true, published);
      if (!(await activeEntryScope(scope, tx))) throw new Error('inactive');
      const review =
        !v.platformAdmin && ['student_union', 'student_activity'].includes(scope.department);
      const values = rows.map((row) => ({
        ...scope,
        ...row,
        serial: row.serial || 'CERT-' + crypto.randomUUID().replaceAll('-', '').toUpperCase(),
        id: crypto.randomUUID(),
        authorId: v.user.id,
      }));
      if (review) {
        for (const row of values) {
          const [existing] = await tx
            .select({ id: certificateRecords.id })
            .from(certificateRecords)
            .where(eq(certificateRecords.serial, row.serial))
            .limit(1);
          if (existing) throw Error('serial collision');
        }
        await tx.insert(certificateChanges).values(values);
      } else
        await tx.insert(certificateRecords).values(
          rows.map((row) => ({
            ...scope,
            ...row,
            serial: row.serial || 'CERT-' + crypto.randomUUID().replaceAll('-', '').toUpperCase(),
            id: crypto.randomUUID(),
            published,
            authorId: v.user.id,
          })),
        );
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: scope.institutionId,
        action: 'certificate.csv_imported',
        entityId: crypto.randomUUID(),
      });
    });
    refresh();
    return {
      success:
        !v.platformAdmin &&
        ['student_union', 'student_activity'].includes(v.institutionAgent?.department || '')
          ? `تم إرسال ${rows.length} سجل لموافقة شؤون الطلاب، دون تغيير السجلات الموثقة.`
          : `تم استيراد ${rows.length} سجل، أي خطأ أو سيريال مكرر يلغي الدفعة كلها دون استبدال سجلات قديمة.`,
    };
  } catch {
    reportFailure('modules.portal.certificates-actions');
    return {
      error:
        'تعذر الاستيراد، راجع رأس CSV والصفوف والتواريخ والسيريالات الفريدة والصلاحيات، لم تُستورد دفعة جزئية.',
    };
  }
}
export async function deleteCertificate(
  _: CertificateState,
  form: FormData,
): Promise<CertificateState> {
  const v = await requireViewer();
  try {
    if (form.get('confirm') !== 'on') throw new Error('confirm');
    await db.transaction(async (tx) => {
      const id = String(form.get('id') || '');
      const [record] = await tx
        .select()
        .from(certificateRecords)
        .where(eq(certificateRecords.id, id))
        .for('update')
        .limit(1);
      if (!record || record.deleted) throw new Error('missing');
      await authority(tx, v, record, true, record.published);
      await tx
        .update(certificateRecords)
        .set({
          deleted: true,
          published: false,
          recipientName: '',
          certificateTitle: '',
          issuedOn: '',
          updatedAt: new Date(),
        })
        .where(eq(certificateRecords.id, id));
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: record.institutionId,
        action: 'certificate.deleted',
        entityId: id,
      });
    });
    refresh();
    // Navigate after revalidation, since the deleted detail route is no longer readable.
  } catch {
    reportFailure('modules.portal.certificates-actions');
    return { error: 'تعذر حذف السجل، راجع التأكيد والصلاحيات.' };
  }
  redirect('/manage/certificates?deleted=1');
}
export async function verifyCertificate(
  _: CertificateState,
  form: FormData,
): Promise<CertificateState> {
  const v = await requireStudentViewer('/services?kind=certificate');
  try {
    const result = await db.transaction(async (tx) => {
      await tx.select({ id: user.id }).from(user).where(eq(user.id, v.user.id)).for('update');
      // Keep only the short rate-limit window, without storing searched serials.
      await tx
        .delete(certificateLookupAttempts)
        .where(
          sql`${certificateLookupAttempts.userId}=${v.user.id} AND ${certificateLookupAttempts.createdAt}<now()-interval '10 minutes'`,
        );
      const attempts = await tx
        .select({ id: certificateLookupAttempts.id })
        .from(certificateLookupAttempts)
        .where(eq(certificateLookupAttempts.userId, v.user.id))
        .limit(20);
      if (attempts.length >= 20) throw new Error('rate');
      await tx
        .insert(certificateLookupAttempts)
        .values({ id: crypto.randomUUID(), userId: v.user.id });
      const serial = serialInput.safeParse(String(form.get('serial') || ''));
      if (!serial.success) return null;
      const [r] = await tx
        .select()
        .from(certificateRecords)
        .where(
          and(
            eq(certificateRecords.serial, serial.data),
            eq(certificateRecords.published, true),
            eq(certificateRecords.deleted, false),
          ),
        )
        .limit(1);
      if (!r || !(await activeEntryScope(r, tx))) return null;
      const [issuer] = await tx
        .select({ name: institutions.name })
        .from(institutions)
        .where(eq(institutions.id, r.institutionId))
        .limit(1);
      return {
        recipientName: r.recipientName,
        certificateTitle: r.certificateTitle,
        issuedOn: r.issuedOn,
        issuer: issuer?.name || '',
        serial: r.serial,
      };
    });
    return result
      ? { result, success: 'تم العثور على سجل شهادة منشور.' }
      : { error: 'لم نعثر على شهادة متاحة بهذا السيريال، راجع الرمز أو تواصل مع الجهة المصدرة.' };
  } catch {
    reportFailure('modules.portal.certificates-actions');
    return { error: 'تعذر التحقق الآن، الحد 20 محاولة خلال 10 دقائق لكل حساب، حاول لاحقًا.' };
  }
}
