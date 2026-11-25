import { CertificateReviewQueue } from './certificate-review-queue';
import { notFound } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import { memberships, user, institutions, faculties } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { FacultyStudentReview } from '@/components/portal-forms';
export async function FacultyStudentDirectory({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const v = await requireViewer(),
    a = v.institutionAgent;
  if (
    !a ||
    a.department !== 'student_affairs' ||
    a.status !== 'active' ||
    !a.canRead ||
    !a.canEdit ||
    !a.facultyId ||
    !a.universityId
  )
    notFound();
  const [i] = await db
    .select()
    .from(institutions)
    .where(eq(institutions.id, a.institutionId))
    .limit(1);
  const [f] = await db.select().from(faculties).where(eq(faculties.id, a.facultyId)).limit(1);
  if (
    !i?.active ||
    !f?.active ||
    i.universityId !== a.universityId ||
    f.universityId !== a.universityId
  )
    notFound();
  const all = await db
    .select({ membership: memberships, name: user.name, email: user.email })
    .from(memberships)
    .innerJoin(user, eq(memberships.userId, user.id))
    .where(
      and(
        eq(memberships.role, 'student'),
        eq(memberships.facultyId, a.facultyId),
        eq(memberships.universityId, a.universityId),
      ),
    )
    .orderBy(desc(memberships.createdAt))
    .limit(200);
  const p = await searchParams;
  const rows = all.filter(
    (x) =>
      (!p.q || (x.name + ' ' + x.email).includes(p.q)) &&
      (!p.status || x.membership.status === p.status),
  );
  const labels: Record<string, string> = {
    pending: 'قيد المراجعة',
    active: 'مفعّل',
    rejected: 'غير مقبول',
    suspended: 'موقوف',
  };
  return (
    <section className="portal-screen manage-screen">
      <h1>إدارة طلاب الكلية</h1>
      <p>
        {i.name} · {f.name}
      </p>
      <div className="notice">
        <p>
          صلاحيتك هنا تفعيل العضوية الأكاديمية أو إيقافها لطلاب كليتك فقط، لا تغيّر كلمات المرور أو
          أدوار الوكلاء أو بيانات الكليات الأخرى.
        </p>
      </div>
      <form className="portal-filters">
        <label>
          البحث
          <input name="q" placeholder="الاسم أو البريد" maxLength={100} defaultValue={p.q} />
        </label>
        <label>
          الحالة
          <select name="status" defaultValue={p.status || ''}>
            <option value="">الكل</option>
            {Object.entries(labels).map(([k, t]) => (
              <option key={k} value={k}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary">بحث</button>
      </form>
      <div className="portal-table-wrap">
        <table className="portal-table">
          <thead>
            <tr>
              <th>الطالب</th>
              <th>حالة العضوية</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ membership: m, name, email }) => (
              <tr key={m.id}>
                <td>
                  <strong>{name}</strong>
                  <br />
                  <small dir="ltr">{email}</small>
                </td>
                <td>{labels[m.status]}</td>
                <td>
                  {m.userId !== v.user.id && <FacultyStudentReview id={m.id} status={m.status} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="portal-empty">
          <h2>لا يوجد طلاب مطابقون في كليتك</h2>
        </div>
      )}
      <CertificateReviewQueue universityId={a.universityId} facultyId={a.facultyId} />
    </section>
  );
}
