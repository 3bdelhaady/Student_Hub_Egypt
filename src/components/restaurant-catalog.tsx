import Link from 'next/link';
import { Coffee, MapPin, ArrowLeft } from 'lucide-react';
import type { PortalEntry } from '@/modules/portal/queries';
import { restaurantHours, restaurantDetails } from '@/modules/portal/restaurants';
export function RestaurantCatalog({
  entries,
  params,
}: {
  entries: PortalEntry[];
  params: { q?: string; category?: string; location?: string; saved?: string };
}) {
  const rows = entries.filter(
    (e) =>
      (!params.q || (e.title + ' ' + e.description + ' ' + e.location).includes(params.q)) &&
      (!params.category || e.category === params.category) &&
      (!params.location || e.location === params.location),
  );
  return (
    <section className="restaurant-screen">
      <header className="restaurant-heading">
        <h1>مطاعم وكافيهات مجتمعك الجامعي</h1>
        <p>اختر المكان، تصفح القائمة وأرسل طلبك</p>
      </header>
      <form action="/store" className="housing-filters">
        <input type="hidden" name="kind" value="restaurant" />
        {params.saved && <input type="hidden" name="saved" value="1" />}
        <label>
          بحث
          <input name="q" defaultValue={params.q} placeholder="ابحث عن مطعم أو كافيه" />
        </label>
        <label>
          التصنيف
          <select name="category" defaultValue={params.category || ''}>
            <option value="">كل التصنيفات</option>
            {[...new Set(entries.map((e) => e.category).filter(Boolean))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          المنطقة
          <select name="location" defaultValue={params.location || ''}>
            <option value="">كل المناطق</option>
            {[...new Set(entries.map((e) => e.location).filter(Boolean))].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <button className="button secondary">تصفية</button>
        <Link href="/store?kind=restaurant">إعادة ضبط</Link>
      </form>
      <div className="restaurant-card-grid">
        {rows.map((e) => {
          const r = restaurantDetails(e.restaurantDetails);
          return (
            <article className="restaurant-card" key={e.id}>
              <Link
                href={'/store/' + e.id}
                className="restaurant-card-art"
                aria-label={'عرض قائمة ' + e.title}
              >
                {e.imageUrl ? <img src={e.imageUrl} alt={e.title} /> : <Coffee size={48} />}
              </Link>
              <div>
                <Coffee size={22} />
                <h2>
                  <Link href={'/store/' + e.id}>{e.title}</Link>
                </h2>
                <p>
                  <MapPin size={13} />
                  {e.location || 'الموقع لم يحدد'}
                </p>
                <span className="tag">{restaurantHours(r) || 'المواعيد غير محددة'}</span>
                {r.delivery && <small>{r.delivery === 'yes' ? 'توصيل متاح' : 'دون توصيل'}</small>}
                <Link href={'/store/' + e.id} className="button secondary">
                  عرض القائمة
                  <ArrowLeft size={16} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!rows.length && (
        <div className="portal-empty">
          <Coffee size={44} />
          <h2>لا توجد مطاعم مطابقة حاليًا</h2>
          <p>تظهر المطاعم المنشورة والمتاحة لمجتمعك هنا.</p>
        </div>
      )}
    </section>
  );
}
