import Link from 'next/link';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import { portalRequests } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requestStatuses, requestLabels } from '@/modules/portal/policy';
import { ClipboardList } from 'lucide-react';
export const metadata = { title: 'طلباتي' };
export default async function Requests({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const v = await requireViewer('/requests');
  const p = await searchParams;
  const all = await db
    .select()
    .from(portalRequests)
    .where(
      and(
        eq(portalRequests.userId, v.user.id),
        isAgentMode(v) ? eq(portalRequests.kind, 'support') : undefined,
      ),
    )
    .orderBy(desc(portalRequests.createdAt))
    .limit(200);
  const rows = all.filter(
    (x) =>
      (!p.status || x.status === p.status) &&
      (!p.q || (x.reference + ' ' + x.subject).includes(p.q)),
  );
  return (
    <section className="portal-screen">
      <div className="workspace-title">
        <span className="eyebrow">مساحتي</span>
        <h1>طلباتي ومتابعتها</h1>
        <p>كل طلبات الخدمات والدعم في مكان واحد.</p>
      </div>
      <div className="request-stats">
        {['pending', 'reviewing', 'accepted', 'completed'].map((s) => (
          <Link href={'/requests?status=' + s} className="portal-form-section" key={s}>
            <strong>{all.filter((x) => x.status === s).length}</strong>
            <span>{requestStatuses[s]}</span>
          </Link>
        ))}
      </div>
      <form className="portal-filters">
        <label>
          ابحث عن طلب
          <input name="q" defaultValue={p.q} placeholder="الرقم أو العنوان" maxLength={100} />
        </label>
        <label>
          الحالة
          <select name="status" defaultValue={p.status || ''}>
            <option value="">كل الحالات</option>
            {Object.entries(requestStatuses).map(([k, t]) => (
              <option key={k} value={k}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary">بحث</button>
      </form>
      <div className="request-list">
        {rows.map((r) => (
          <Link className="request-row" href={'/requests/' + r.id} key={r.id}>
            <span className="notification-icon">
              <ClipboardList size={22} />
            </span>
            <div>
              <small>
                {requestLabels[r.kind] || 'طلب خدمة'} · {r.reference}
              </small>
              <h2>{r.subject}</h2>
              <time>{r.createdAt.toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</time>
            </div>
            <span className={'status-pill status-' + r.status}>{requestStatuses[r.status]}</span>
          </Link>
        ))}
      </div>
      {!rows.length && (
        <div className="portal-empty">
          <ClipboardList size={40} />
          <h2>لا توجد طلبات مطابقة</h2>
          <Link className="button primary" href={isAgentMode(v) ? '/help' : '/services'}>
            {isAgentMode(v) ? 'تواصل مع الدعم' : 'استكشف الخدمات'}
          </Link>
        </div>
      )}
    </section>
  );
}
