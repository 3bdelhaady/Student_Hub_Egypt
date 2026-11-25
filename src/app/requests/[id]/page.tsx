import { ReviewDemoNotice } from '@/components/review-demo-notice';
import Link from 'next/link';
import { supportAccess } from '@/modules/portal/support';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { notFound } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import {
  academicTeamJoinDecisions,
  portalRequests,
  portalEntries,
  requestMessages,
  user,
  academicTeamProposals,
  volunteerRequestChoices,
} from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { canManagePortalEntry, canReadPortalEntry } from '@/modules/portal/queries';
import { requestStatuses, commerceKinds } from '@/modules/portal/policy';
import { RequestReply, RequestDecision } from '@/components/portal-forms';
import { money } from '@/components/portal-catalog';
export const metadata = { title: 'متابعة الطلب' };
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await requireViewer('/requests/' + id);
  const [r] = await db.select().from(portalRequests).where(eq(portalRequests.id, id)).limit(1);
  if (!r) notFound();
  const [entry] = r.entryId
    ? await db.select().from(portalEntries).where(eq(portalEntries.id, r.entryId)).limit(1)
    : [];
  const manager =
    r.kind !== 'team' &&
    (isAgentMode(v) || v.platformAdmin) &&
    (r.kind === 'support'
      ? await supportAccess(v, r.id, true)
      : v.platformAdmin ||
        (!!entry &&
          (!r.recipientId || r.recipientId === v.user.id) &&
          (await canManagePortalEntry(v, entry))));
  const reader =
    r.kind === 'support'
      ? await supportAccess(v, r.id)
      : !!entry &&
        (!r.recipientId || r.recipientId === v.user.id) &&
        (await canReadPortalEntry(v, entry));
  if ((r.userId !== v.user.id || (isAgentMode(v) && r.kind !== 'support')) && !manager && !reader)
    notFound();
  const [proposal] =
    r.kind === 'team_creation'
      ? await db
          .select()
          .from(academicTeamProposals)
          .where(eq(academicTeamProposals.requestId, id))
          .limit(1)
      : [];
  const [volunteerChoice] =
    r.kind === 'volunteer'
      ? await db
          .select()
          .from(volunteerRequestChoices)
          .where(eq(volunteerRequestChoices.requestId, id))
          .limit(1)
      : [];
  const [joinDecision] =
    r.kind === 'team'
      ? await db
          .select()
          .from(academicTeamJoinDecisions)
          .where(eq(academicTeamJoinDecisions.requestId, id))
          .limit(1)
      : [];
  const messages = await db
    .select({ message: requestMessages, name: user.name })
    .from(requestMessages)
    .innerJoin(user, eq(requestMessages.authorId, user.id))
    .where(eq(requestMessages.requestId, id))
    .orderBy(asc(requestMessages.createdAt))
    .limit(200);
  const legacyCommerceKinds = [...commerceKinds, 'trip', 'training'];
  const closed = r.status === 'completed';
  return (
    <section className="portal-screen">
      {entry?.demo && <ReviewDemoNotice />}
      <div className="breadcrumbs">
        <Link href={isAgentMode(v) && r.kind !== 'support' ? '/manage?tab=requests' : '/requests'}>
          {isAgentMode(v) && r.kind !== 'support' ? 'طلبات القسم' : 'طلباتي'}
        </Link>
        <span>{r.reference}</span>
      </div>
      <div className="section-heading">
        <div>
          <h1>{r.subject}</h1>
          <p>
            {r.reference} · {r.createdAt.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}
          </p>
        </div>
        <span className={'status-pill status-' + r.status}>{requestStatuses[r.status]}</span>
      </div>
      <div className="portal-detail-grid">
        <div>
          <article className="portal-form-section">
            <h2>تفاصيل الطلب</h2>
            <p className="prose">{r.body}</p>
            {joinDecision && (
              <p>
                {joinDecision.outcome === 'accepted'
                  ? 'وافق قائد الفريق على انضمامك.'
                  : 'لم يوافق قائد الفريق على طلب الانضمام. انتهت مراجعة الطلب دون إضافة عضوية.'}
              </p>
            )}
            {r.purpose && (
              <div className="store-request-summary">
                <h3>{r.purpose === 'inspection' ? 'طلب معاينة' : 'طلب شراء كاش'}</h3>
                <p>الناشر المستلم: {r.orderDetails.publisherName || 'ناشر الخدمة'}</p>
                <p>
                  {r.paymentMethod === 'cash'
                    ? 'طريقة الدفع: كاش، لم يُحصّل مبلغ عبر الموقع'
                    : 'دون دفع'}
                </p>
                {r.purpose === 'purchase' && (
                  <p>
                    الإجمالي عند إرسال الطلب:{' '}
                    {money(r.orderDetails.total ?? r.unitPriceMinor * r.quantity)}
                  </p>
                )}
              </div>
            )}
            {r.orderDetails.ticketTier && (
              <section>
                <h2>نوع التذكرة</h2>
                <h3>{r.orderDetails.ticketTier.title}</h3>
                <p>{r.orderDetails.ticketTier.description}</p>
                <p>{money(r.orderDetails.ticketTier.unitPriceMinor)}</p>
              </section>
            )}
            {r.orderDetails.items?.length ? (
              <section className="store-student-summary">
                <h3>أصناف الطلب</h3>
                {r.orderDetails.items.map((item) => (
                  <p key={item.id}>
                    {item.title} × {item.quantity}، {money(item.unitPriceMinor * item.quantity)}
                  </p>
                ))}
              </section>
            ) : null}
            {volunteerChoice && (
              <div className="notice">
                <div>
                  <strong>قسم التطوع عند إرسال الطلب: {volunteerChoice.divisionLabel}</strong>
                  <p>
                    الطلب للمراجعة اليدوية، لا ينشئ قبول الطلب عضوية أو تكليفًا تطوعيًا خارج المنصة،
                    ولا يمثل إثبات دفع.
                  </p>
                </div>
              </div>
            )}
            {r.kind === 'team_creation' && (
              <div className="notice">
                <div>
                  <strong>إنشاء فريق أكاديمي</strong>
                  {proposal && (
                    <p>
                      المقرر عند إرسال الطلب: {proposal.courseTitle} · الرمز البصري:{' '}
                      {proposal.marker}
                    </p>
                  )}
                  <p>
                    إذا كان المقرر يتطلب الموافقة، يراجعه منسق اتحاد الكلية المخول قبل إتاحة الفريق.
                    عند عدم اشتراط الموافقة، يُتاح الفريق مباشرة. يظل الحد الأقصى للأعضاء ساريًا.
                  </p>
                </div>
              </div>
            )}

            {entry && !entry.archived && !isAgentMode(v) && (
              <Link
                className="text-link"
                href={`${commerceKinds.includes(entry.kind) ? '/store' : '/services'}/${entry.id}`}
              >
                عرض الخدمة
              </Link>
            )}
            {legacyCommerceKinds.includes(r.kind) && !r.purpose && (
              <div className="request-cost">
                <span>
                  {r.quantity} × {money(r.unitPriceMinor)}
                </span>
                <strong>{money(r.unitPriceMinor * r.quantity)}</strong>
              </div>
            )}
          </article>
          <section className="portal-form-section">
            <h2>المتابعة والمراسلات</h2>
            {messages.length ? (
              <div className="request-messages">
                {messages.map(({ message: m, name }) => (
                  <article className={m.authorId === v.user.id ? 'own' : ''} key={m.id}>
                    <strong>{m.authorId === v.user.id ? 'أنت' : name}</strong>
                    <time>{m.createdAt.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</time>
                    <p>{m.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="form-hint">لم تُضف ردود بعد.</p>
            )}
            {!closed && (manager || r.userId === v.user.id) ? (
              <RequestReply id={id} />
            ) : (
              <div className="notice">
                <div>
                  <strong>{closed ? 'أُغلق هذا الطلب' : 'عرض الطلب للقراءة فقط'}</strong>
                  <p>
                    تبقى التفاصيل والمراسلات محفوظة للرجوع إليها، إذا احتجت متابعة إضافية، أرسل
                    تذكرة دعم مع رقم الطلب.
                  </p>
                  <Link className="text-link" href="/help#contact">
                    تواصل مع الدعم
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
        {manager && (
          <aside>
            <div className="portal-form-section">
              <h2>حالة الطلب</h2>
              <ol className="request-timeline">
                {(closed && r.status !== 'completed'
                  ? ['pending', r.status]
                  : ['pending', 'reviewing', 'accepted', 'completed']
                ).map((s) => (
                  <li className={r.status === s ? 'current' : ''} key={s}>
                    {requestStatuses[s]}
                  </li>
                ))}
              </ol>
              {legacyCommerceKinds.includes(r.kind) && !r.purpose && (
                <p className="form-hint">
                  طلب بتأكيد يدوي، لا يتم خصم أموال عبر المنصة، لا يمثل هذا الطلب إثبات دفع أو حجزًا
                  صادرًا من مزود خارجي.
                </p>
              )}
              {(manager || r.userId === v.user.id) && (
                <RequestDecision id={id} status={r.status} manager={manager} />
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
