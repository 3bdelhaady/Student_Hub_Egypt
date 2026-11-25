import { PlatformConsoleFrame } from '@/components/platform-console-frame';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import { portalRequests, supportDestinations, user } from '@/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { supportAccess } from '@/modules/portal/support';
import { requestStatuses } from '@/modules/portal/policy';
export const metadata = { title: 'صندوق الواردات' };
export default async function SupportInbox({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const v = await requireViewer();
  const p = await searchParams;
  const a = v.institutionAgent;
  if (
    !v.platformAdmin &&
    (!a ||
      a.status !== 'active' ||
      !a.canRead ||
      !['student_affairs', 'youth_welfare', 'student_union', 'student_activity'].includes(
        a.department,
      ))
  )
    notFound();
  const all = await db
    .select({ request: portalRequests, destination: supportDestinations, name: user.name })
    .from(portalRequests)
    .innerJoin(user, eq(user.id, portalRequests.userId))
    .leftJoin(supportDestinations, eq(supportDestinations.requestId, portalRequests.id))
    .where(
      and(
        eq(portalRequests.kind, 'support'),
        v.platformAdmin
          ? isNull(supportDestinations.requestId)
          : and(
              eq(supportDestinations.institutionId, a!.institutionId),
              eq(supportDestinations.facultyId, a!.facultyId!),
              eq(supportDestinations.department, a!.department),
              a!.organizationId
                ? eq(supportDestinations.organizationId, a!.organizationId)
                : isNull(supportDestinations.organizationId),
            ),
      ),
    )
    .orderBy(desc(portalRequests.updatedAt))
    .limit(200);
  const rows = [];
  for (const row of all) if (await supportAccess(v, row.request.id)) rows.push(row);
  const filtered = rows.filter(
    ({ request: r }) =>
      (!p.q || (r.subject + ' ' + r.reference).includes(p.q)) &&
      (!p.status || r.status === p.status),
  );
  const inbox = (
    <section className={v.platformAdmin ? 'panel console-inbox' : 'portal-screen'}>
      <div className="section-heading">
        <div>
          {!v.platformAdmin && <h1>صندوق الواردات</h1>}
          <p>
            {v.platformAdmin
              ? 'مشاكل ورسائل المستخدمين الموجهة إلى أدمن المنصة.'
              : 'رسائل الطلاب الموجهة إلى جهتك فقط، وليست رسائل الجهات الأخرى.'}
          </p>
        </div>
        {!v.platformAdmin && (
          <Link
            className="button secondary"
            href={v.platformAdmin ? '/admin?tab=institutions' : '/agent'}
          >
            لوحة الإدارة
          </Link>
        )}
      </div>
      <form className="portal-filters">
        <label>
          بحث في الرسائل
          <input name="q" defaultValue={p.q || ''} maxLength={120} />
        </label>
        <label>
          الحالة
          <select name="status" defaultValue={p.status || ''}>
            <option value="">كل الحالات</option>
            {Object.entries(requestStatuses).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary">بحث</button>
      </form>
      <p>آخر 200 رسالة ضمن النطاق.</p>
      <div className="request-list">
        {filtered.map(({ request: r, name, destination }) => (
          <Link className="request-row" key={r.id} href={'/requests/' + r.id}>
            <div>
              <small>
                {r.reference} · {name} · {destination?.label || 'أدمن المنصة'}
              </small>
              <h2>{r.subject}</h2>
            </div>
            <span className={'status-pill status-' + r.status}>{requestStatuses[r.status]}</span>
          </Link>
        ))}
      </div>
      {!filtered.length && <p>لا توجد رسائل مطابقة.</p>}
    </section>
  );
  return v.platformAdmin ? (
    <PlatformConsoleFrame
      inbox
      title="صندوق الواردات"
      description="رسائل وطلبات المستخدمين الموجهة إلى أدمن المنصة"
      total={rows.length}
      active={
        rows.filter(({ request: r }) => !['cancelled', 'rejected', 'completed'].includes(r.status))
          .length
      }
    >
      {inbox}
    </PlatformConsoleFrame>
  ) : (
    inbox
  );
}
