import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import {
  certificateRecords,
  certificateChanges,
  institutions,
  faculties,
  studentOrganizations,
} from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { canReadPortal } from '@/modules/portal/management-policy';
import { activeEntryScope } from '@/modules/portal/queries';
import { hasSectionRight } from '@/modules/institution/section-policy';
import {
  CertificateEditor,
  CertificateCsvImport,
  CertificateDelete,
} from '@/components/certificate-forms';
export const metadata = { title: 'سجل الشهادات' };
export default async function Certificates({
  searchParams,
  embedded = false,
}: {
  embedded?: boolean;
  searchParams: Promise<{ edit?: string; new?: string; csv?: string; q?: string }>;
}) {
  const route = embedded ? '/manage?kind=certificate' : '/manage/certificates';
  const suffix = (q: string) => route + (embedded ? '&' : '?') + q;
  const v = await requireViewer();
  const a = v.institutionAgent;
  const p = await searchParams;
  if (
    !v.platformAdmin &&
    (!a || !canReadPortal(a, { ...a, kind: 'certificate' }, await activeEntryScope(a)))
  )
    notFound();
  const all = await db
    .select()
    .from(certificateRecords)
    .where(
      and(
        eq(certificateRecords.deleted, false),
        v.platformAdmin ? undefined : eq(certificateRecords.institutionId, a!.institutionId),
      ),
    )
    .orderBy(desc(certificateRecords.createdAt))
    .limit(500);
  const rows = [];
  for (const r of all)
    if (
      v.platformAdmin ||
      canReadPortal(a, { ...r, kind: 'certificate' }, await activeEntryScope(r))
    )
      rows.push(r);
  const record = p.edit ? rows.find((r) => r.id === p.edit) : undefined;
  if (p.edit && !record) notFound();
  const editable = v.platformAdmin || hasSectionRight(a, 'certificate', 'canEdit');
  const reviewRequired =
    !v.platformAdmin && ['student_union', 'student_activity'].includes(a?.department || '');
  const pendingChanges = reviewRequired
    ? await db
        .select()
        .from(certificateChanges)
        .where(
          and(eq(certificateChanges.authorId, v.user.id), eq(certificateChanges.status, 'pending')),
        )
        .orderBy(desc(certificateChanges.createdAt))
    : [];
  const publish = v.platformAdmin || hasSectionRight(a, 'certificate', 'canPublish');
  if (
    (p.new || p.csv || p.edit) &&
    (!editable || (record?.published && !publish && !reviewRequired))
  )
    notFound();
  const inst = await db
    .select()
    .from(institutions)
    .where(v.platformAdmin ? undefined : eq(institutions.id, a!.institutionId));
  const fac = await db
    .select()
    .from(faculties)
    .where(
      v.platformAdmin
        ? undefined
        : a?.facultyId
          ? eq(faculties.id, a.facultyId)
          : eq(faculties.id, '__none__'),
    );
  const org = await db
    .select()
    .from(studentOrganizations)
    .where(
      v.platformAdmin
        ? undefined
        : a?.organizationId
          ? eq(studentOrganizations.id, a.organizationId)
          : eq(studentOrganizations.id, '__none__'),
    );
  const scope = {
    institutions: inst,
    faculties: fac,
    organizations: org,
    ownScope: v.platformAdmin
      ? undefined
      : {
          institutionId: a!.institutionId,
          facultyId: a!.facultyId,
          organizationId: a!.organizationId,
          department: a!.department,
        },
  };
  const filtered = rows.filter(
    (r) => !p.q || (r.serial + ' ' + r.recipientName + ' ' + r.certificateTitle).includes(p.q),
  );
  return (
    <section className="portal-screen">
      {!embedded && <h1>سجل الشهادات</h1>}
      {pendingChanges.length > 0 && (
        <section className="panel">
          <h2>بانتظار موافقة شؤون الطلاب</h2>
          {pendingChanges.map((c) => (
            <p key={c.id}>
              {c.recipientName} · {c.certificateTitle} · {c.issuedOn}
            </p>
          ))}
        </section>
      )}
      <nav className="certificate-manage-nav">
        <Link href={route}>السجلات</Link>
        {editable && (
          <>
            <Link href={suffix('new=1')}>إضافة يدوية</Link>
            <Link href={suffix('csv=1')}>استيراد CSV</Link>
          </>
        )}
      </nav>
      {p.csv ? (
        <CertificateCsvImport scope={scope} canPublish={publish && !reviewRequired} />
      ) : p.new || record ? (
        <>
          <CertificateEditor
            scope={scope}
            record={record}
            canPublish={publish && !reviewRequired}
          />
          {record && <CertificateDelete id={record.id} />}
        </>
      ) : (
        <>
          <form action={route}>
            <label>
              بحث داخل السجلات
              {embedded && <input type="hidden" name="kind" value="certificate" />}
              <input name="q" defaultValue={p.q || ''} maxLength={120} />
            </label>
            <button className="button secondary">بحث</button>
          </form>
          <p>آخر 500 سجل كحد أقصى، لا توجد قائمة عامة للطلاب.</p>
          <div className="portal-table-wrap" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th>السيريال</th>
                  <th>صاحب الشهادة</th>
                  <th>الشهادة</th>
                  <th>الإصدار</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td dir="ltr">{r.serial}</td>
                    <td>{r.recipientName}</td>
                    <td>{r.certificateTitle}</td>
                    <td>{r.issuedOn}</td>
                    <td>{r.published ? 'متاح للتحقق' : 'مسودة'}</td>
                    <td>
                      {editable && (!r.published || publish || reviewRequired) ? (
                        <Link href={suffix('edit=' + r.id)}>تعديل أو حذف</Link>
                      ) : (
                        'قراءة فقط'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && <p>لا توجد سجلات مطابقة.</p>}
        </>
      )}
    </section>
  );
}
