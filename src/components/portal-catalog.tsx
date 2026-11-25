import { RestaurantCatalog } from './restaurant-catalog';
import { HousingCatalog } from './housing-catalog';
import { ProductIcon } from './product-icon';
import { ReviewDemoNotice } from './review-demo-notice';
import Link from 'next/link';
import {
  ShoppingBag,
  Home,
  Ticket,
  Coffee,
  Bus,
  GraduationCap,
  Users,
  HeartHandshake,
  FileBadge,
  Vote,
  ClipboardList,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { visiblePortalEntries } from '@/modules/portal/queries';
import { entryLabels, commerceKinds } from '@/modules/portal/policy';
import { portalSaved } from '@/db/schema';
import { db } from '@/db';
import { viewer, studentAreaViewer } from '@/lib/session';
import { eq } from 'drizzle-orm';
const icons: Record<string, typeof ShoppingBag> = {
  product: ShoppingBag,
  housing: Home,
  ticket: Ticket,
  restaurant: Coffee,
  trip: Bus,
  training: GraduationCap,
  team: Users,
  volunteer: HeartHandshake,
  certificate: FileBadge,
  service: ClipboardList,
  poll: Vote,
};
export const money = (minor: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(minor / 100);
export async function PortalCatalog({
  service = false,
  params,
}: {
  service?: boolean;
  params: {
    kind?: string;
    q?: string;
    category?: string;
    saved?: string;
    sort?: string;
    ticketType?: string;
    housingType?: string;
    location?: string;
    maxPrice?: string;
    audience?: string;
  };
}) {
  await studentAreaViewer();
  const root = service ? '/services' : '/store';
  const kinds = Object.keys(entryLabels).filter((x) =>
    service ? !commerceKinds.includes(x) : commerceKinds.includes(x),
  );
  const kind =
    params.kind && kinds.includes(params.kind)
      ? params.kind
      : service || params.saved
        ? undefined
        : 'product';
  const all = (await visiblePortalEntries()).filter((e) => kinds.includes(e.kind));
  const v = await viewer();
  const saved = v
    ? await db.select().from(portalSaved).where(eq(portalSaved.userId, v.user.id))
    : [];
  const ids = new Set(saved.map((x) => x.entryId));
  if (kind === 'restaurant')
    return (
      <RestaurantCatalog
        entries={all.filter((e) => e.kind === 'restaurant' && (!params.saved || ids.has(e.id)))}
        params={params}
      />
    );
  if (kind === 'housing')
    return (
      <HousingCatalog
        entries={all.filter((e) => e.kind === 'housing' && (!params.saved || ids.has(e.id)))}
        params={params}
      />
    );
  let rows = all.filter(
    (e) =>
      (!kind || e.kind === kind) &&
      (!params.ticketType || e.kind !== 'ticket' || e.ticketType === params.ticketType) &&
      (!params.q || (e.title + ' ' + e.description + ' ' + e.location).includes(params.q)) &&
      (!params.category || e.category === params.category) &&
      (!params.saved || ids.has(e.id)),
  );
  if (params.sort === 'price-asc') rows.sort((a, b) => a.priceMinor - b.priceMinor);
  if (params.sort === 'price-desc') rows.sort((a, b) => b.priceMinor - a.priceMinor);
  const title = kind ? entryLabels[kind] : service ? 'الخدمات الأساسية' : 'المتجر الأكاديمي';
  const Icon = icons[kind || 'service'];
  const descriptions: Record<string, string> = {
    product: 'احتياجاتك الدراسية، من مكان واحد.',
    ticket: 'اكتشف الفعاليات والرحلات وتابع طلبك بسهولة.',
    housing: 'ابحث عن سكن يناسب احتياجاتك وراجع تفاصيله قبل إرسال الطلب.',
    restaurant: 'اكتشف المطاعم والكافيهات المتاحة لمجتمعك.',
    trip: 'رحلات وتجارب جديدة مع مجتمعك.',
    training: 'تعلّم مهارة جديدة وطوّر خبراتك.',
    team: 'اعثر على فريق يشاركك الاهتمامات.',
    volunteer: 'شارك وقتك ومهاراتك واصنع أثرًا طيبًا.',
    certificate: 'قدّم طلبك وتابع مراجعته من الجهة المسؤولة.',
    service: 'طلباتك الجامعية، منظمة وقابلة للمتابعة.',
    poll: 'شارك رأيك في استبيانات مجتمعك.',
  };
  const productHero = !service && kind === 'product';
  return (
    <section className="portal-screen">
      {all.some((e) => e.demo) && <ReviewDemoNotice />}
      {kind === 'ticket' && (
        <nav className="resource-tabs" aria-label="أنواع التذاكر">
          <Link href="/store?kind=ticket">كل التذاكر</Link>
          <Link href="/store?kind=ticket&ticketType=concert">حفلة غنائية</Link>
          <Link href="/store?kind=ticket&ticketType=graduation">حفلة تخرج</Link>
          <Link href="/store?kind=ticket&ticketType=standup">حفلة ستاند أب كوميدي</Link>
          <Link href="/store?kind=ticket&ticketType=trip">رحلة</Link>
        </nav>
      )}
      <div className={`portal-hero${productHero ? ' portal-product-hero' : ''}`}>
        {productHero && (
          <img
            className="portal-product-hero-art"
            src="/design/student-store-hero.jpg"
            alt=""
            aria-hidden="true"
          />
        )}
        <span className="tag">{service ? 'حياتك الجامعية أسهل' : 'مركز الطلاب'}</span>
        <h1>{title}</h1>
        <p>{descriptions[kind || 'service']}</p>
        {productHero ? (
          <Link className="portal-product-cta" href="#portal-catalog">
            تصفح المنتجات <ArrowLeft size={16} />
          </Link>
        ) : (
          <Icon className="portal-hero-icon" size={140} />
        )}
      </div>
      {v && v.membership?.status !== 'active' && (
        <div className="notice warning">
          <div>
            <strong>خدمات كليتك مرتبطة بتفعيل العضوية</strong>
            <p>
              يمكنك تصفح الخدمات العامة المتاحة الآن، خدمات الجامعة تظهر بعد موافقة مسؤول المجتمع.
            </p>
            <Link className="text-link" href="/account?view=student">
              متابعة حالة العضوية
            </Link>{' '}
            ·{' '}
            <Link className="text-link" href="/help?topic=activation#contact">
              طلب مساعدة
            </Link>
          </div>
        </div>
      )}
      {!v && (
        <nav className="portal-kind-grid" aria-label="أقسام الصفحة">
          {kinds.map((k) => {
            const I = icons[k];
            const next = new URLSearchParams({ kind: k });
            if (params.saved) next.set('saved', '1');
            if (params.q) next.set('q', params.q);
            if (params.sort) next.set('sort', params.sort);
            return (
              <Link
                href={`${root}?${next.toString()}`}
                key={k}
                aria-current={kind === k ? 'page' : undefined}
              >
                <I size={23} />
                <span>{entryLabels[k]}</span>
              </Link>
            );
          })}
        </nav>
      )}
      <div className="portal-toolbar" id="portal-catalog">
        <form action={root} className="portal-search">
          {params.saved && <input type="hidden" name="saved" value="1" />}
          {params.category && <input type="hidden" name="category" value={params.category} />}
          {params.sort && <input type="hidden" name="sort" value={params.sort} />}
          <Search size={18} />
          {kind && <input type="hidden" name="kind" value={kind} />}
          <input
            name="q"
            placeholder="ابحث بالاسم أو الموقع..."
            aria-label="بحث"
            defaultValue={params.q}
            maxLength={120}
          />
          <button className="button primary" type="submit">
            بحث
          </button>
        </form>
        <Link className="button secondary" href={`${root}?saved=1`}>
          المحفوظات
        </Link>
        <Link className="button secondary" href="/requests">
          طلباتي
        </Link>
      </div>
      <form action={root} className="portal-filters">
        {params.saved && <input type="hidden" name="saved" value="1" />}
        {kind && <input type="hidden" name="kind" value={kind} />}
        <input type="hidden" name="q" value={params.q || ''} />
        <label>
          التصنيف
          <select name="category" defaultValue={params.category || ''}>
            <option value="">كل التصنيفات</option>
            {[
              ...new Set(
                all
                  .filter((e) => !kind || e.kind === kind)
                  .map((e) => e.category)
                  .filter(Boolean),
              ),
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          ترتيب
          <select name="sort" defaultValue={params.sort || 'newest'}>
            <option value="newest">الأحدث أولًا</option>
            <option value="price-asc">السعر، الأقل أولًا</option>
            <option value="price-desc">السعر، الأعلى أولًا</option>
          </select>
        </label>
        <button className="button secondary">تطبيق</button>
        <span className="form-hint">{rows.length} نتيجة</span>
      </form>
      {(params.saved || params.q || params.category) && (
        <div className="section-heading">
          <h2>{params.saved ? 'المحفوظات' : 'نتائج البحث'}</h2>
          <Link className="text-link" href={root}>
            مسح البحث والتصفية
          </Link>
        </div>
      )}
      {rows.length ? (
        <div className="portal-card-grid">
          {rows.map((e) => {
            const I = icons[e.kind];
            const closed = e.capacity === 0 || (!!e.closesAt && e.closesAt <= new Date());
            return (
              <article className="portal-card" key={e.id}>
                <Link href={`${root}/${e.id}`} className="portal-card-art">
                  {e.imageUrl ? (
                    <img src={e.imageUrl} alt={e.title} loading="lazy" />
                  ) : e.kind === 'product' ? (
                    <ProductIcon title={e.title} />
                  ) : (
                    <I size={52} />
                  )}
                  <span className="tag">{e.category || entryLabels[e.kind]}</span>
                </Link>
                <div className="portal-card-body">
                  <h2>
                    <Link href={`${root}/${e.id}`}>{e.title}</Link>
                  </h2>
                  <p>{e.description.slice(0, 130)}</p>
                  {e.location && <small>{e.location}</small>}
                  <div className="portal-card-bottom">
                    <strong>{e.priceMinor ? money(e.priceMinor) : 'بدون رسوم منشورة'}</strong>
                    <Link
                      className="portal-open"
                      href={`${root}/${e.id}`}
                      aria-label={'تفاصيل ' + e.title}
                    >
                      <ArrowLeft size={16} />
                    </Link>
                  </div>
                  {closed && <small className="catalog-closed">التقديم مغلق</small>}
                  {!closed && e.capacity !== null && <small>{`${e.capacity} متاح`}</small>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty">
          <Icon size={46} />
          <h2>
            {params.q || params.category || params.saved
              ? 'لا توجد نتائج مطابقة'
              : 'لا توجد خدمات منشورة في هذا القسم بعد'}
          </h2>
          <p>
            {params.q || params.category || params.saved
              ? 'جرّب تغيير البحث أو التصنيف.'
              : 'تظهر هنا الخدمات التي تنشرها الجهات المخولة في نطاقك.'}
          </p>
          <Link className="button secondary" href={root}>
            عرض جميع النتائج
          </Link>
        </div>
      )}
    </section>
  );
}
