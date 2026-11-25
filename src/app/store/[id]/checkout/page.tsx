import { checkoutDigest } from '@/modules/portal/checkout-digest';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { portalEntries, portalRequests, user } from '@/db/schema';
import { requireStudentViewer } from '@/lib/session';
import { canStudentReadEntry, commerceKinds } from '@/modules/portal/policy';
import { activeStudentEntryScope } from '@/modules/portal/queries';
import { applicationProfile } from '@/modules/portal/application-profile';
import { restaurantDetails } from '@/modules/portal/restaurants';
import { housingDetails } from '@/modules/portal/housing';
import { StoreCheckout } from '@/components/store-checkout';
import { money } from '@/components/portal-catalog';
export const metadata = { title: 'إتمام الطلب' };
export default async function Checkout({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ purpose?: string }>;
}) {
  const { id } = await params,
    p = await searchParams,
    v = await requireStudentViewer('/store/' + id + '/checkout');
  const [e] = await db.select().from(portalEntries).where(eq(portalEntries.id, id)).limit(1);
  if (
    !e ||
    !commerceKinds.includes(e.kind) ||
    !canStudentReadEntry(v.membership, e, await activeStudentEntryScope(e, v.membership))
  )
    notFound();
  const [request] = await db
    .select()
    .from(portalRequests)
    .where(
      and(
        eq(portalRequests.userId, v.user.id),
        eq(portalRequests.entryId, id),
        inArray(portalRequests.status, ['pending', 'reviewing', 'accepted']),
      ),
    )
    .limit(1);
  const [publisher] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, e.authorId))
    .limit(1);
  const profile = await applicationProfile(v.user.id);
  const h = housingDetails(e.housingDetails),
    closed =
      e.capacity === 0 ||
      !!(e.closesAt && e.closesAt <= new Date()) ||
      (e.kind === 'restaurant' &&
        (restaurantDetails(e.restaurantDetails).open === 'closed' ||
          !restaurantDetails(e.restaurantDetails).menu.some((item) => item.available)));
  return (
    <section className="housing-screen">
      <div className="breadcrumbs">
        <Link href={'/store/' + id}>العودة للتفاصيل</Link>
        <span>إتمام الطلب</span>
      </div>
      {request ? (
        <section className="portal-form-section">
          <h1>لديك طلب قائم</h1>
          <Link className="button primary" href={'/requests/' + request.id}>
            متابعة هذا الطلب
          </Link>
        </section>
      ) : closed ? (
        <h1>هذه الخدمة غير متاحة للطلبات حاليًا</h1>
      ) : (
        <div className="store-checkout-grid">
          <StoreCheckout
            entry={e}
            digest={checkoutDigest(e)}
            tiers={e.ticketTiers}
            restaurant={e.kind === 'restaurant' ? e.restaurantDetails : undefined}
            studentFields={profile.fields}
            profileDigest={profile.digest}
            recipientName={publisher?.name || 'ناشر الخدمة'}
            deposit={e.kind === 'housing' ? Math.round(h.deposit * 100) : 0}
            serviceFee={e.kind === 'housing' ? Math.round(h.serviceFee * 100) : 0}
            inspection={p.purpose === 'inspection' && e.kind === 'housing'}
          />
          <aside className="store-order-summary">
            <h1>ملخص الطلب</h1>
            {e.imageUrl && <img src={e.imageUrl} alt="" />}
            <h2>{e.title}</h2>
            <p>{e.location}</p>
            {!['restaurant', 'ticket'].includes(e.kind) && <strong>{money(e.priceMinor)}</strong>}
            <p className="form-hint">
              التأكيد من الناشر داخل المنصة، لا يُعد الطلب إثبات تحصيل أموال أو حجز صادر من جهة
              خارجية.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
