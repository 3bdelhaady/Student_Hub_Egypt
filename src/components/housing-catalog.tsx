import Link from 'next/link';
import { Home, MapPin, BedDouble, DoorOpen, ArrowLeft, Users } from 'lucide-react';
import type { PortalEntry } from '@/modules/portal/queries';
import { housingDetails, housingTypes, housingAudiences } from '@/modules/portal/housing';
import { money } from './portal-catalog';
export type HousingParams = {
  q?: string;
  category?: string;
  sort?: string;
  saved?: string;
  housingType?: string;
  location?: string;
  maxPrice?: string;
  audience?: string;
};
export function HousingCatalog({
  entries,
  params,
}: {
  entries: PortalEntry[];
  params: HousingParams;
}) {
  const max = Number(params.maxPrice),
    rows = entries.filter((e) => {
      const h = housingDetails(e.housingDetails);
      return (
        (!params.q || (e.title + ' ' + e.description + ' ' + e.location).includes(params.q)) &&
        (!params.housingType || h.type === params.housingType) &&
        (!params.location || e.location === params.location) &&
        (!params.audience || h.audience === params.audience) &&
        (!params.maxPrice || !Number.isFinite(max) || e.priceMinor <= max * 100)
      );
    });
  if (params.sort === 'price-asc') rows.sort((a, b) => a.priceMinor - b.priceMinor);
  if (params.sort === 'price-desc') rows.sort((a, b) => b.priceMinor - a.priceMinor);
  return (
    <section className="housing-screen">
      <header className="housing-catalog-heading">
        <div>
          <h1>السكن الطلابي</h1>
          <p>اختر سكنًا يناسبك، وراجع تفاصيله واطلب معاينته</p>
        </div>
        <Link href="/requests" className="button secondary">
          طلبات المعاينة والحجز
        </Link>
      </header>
      <form action="/store" className="housing-filters">
        <input type="hidden" name="kind" value="housing" />
        {params.saved && <input type="hidden" name="saved" value="1" />}
        <label>
          بحث
          <input name="q" placeholder="اسم السكن أو الموقع" defaultValue={params.q} />
        </label>
        <label>
          النوع
          <select name="housingType" defaultValue={params.housingType || ''}>
            <option value="">كل الأنواع</option>
            {Object.entries(housingTypes).map(([id, label]) => (
              <option value={id} key={id}>
                {label}
              </option>
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
        <label>
          مخصص لـ
          <select name="audience" defaultValue={params.audience || ''}>
            <option value="">الكل</option>
            {Object.entries(housingAudiences).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          أقصى إيجار شهري
          <input
            name="maxPrice"
            type="number"
            min="0"
            max="1000000"
            defaultValue={params.maxPrice}
          />
        </label>
        <label>
          الترتيب
          <select name="sort" defaultValue={params.sort || 'newest'}>
            <option value="newest">الأحدث</option>
            <option value="price-asc">الأقل سعرًا</option>
            <option value="price-desc">الأعلى سعرًا</option>
          </select>
        </label>
        <button className="button primary">تصفية النتائج</button>
        <Link href="/store?kind=housing" className="text-link">
          إعادة ضبط
        </Link>
      </form>
      {(params.q ||
        params.saved ||
        params.housingType ||
        params.location ||
        params.audience ||
        params.maxPrice) && (
        <Link className="text-link" href="/store">
          مسح البحث والتصفية
        </Link>
      )}
      <p className="form-hint">{rows.length} سكن متاح للعرض</p>
      {rows.length ? (
        <div className="housing-card-grid">
          {rows.map((e) => {
            const h = housingDetails(e.housingDetails);
            return (
              <article key={e.id} className="housing-card">
                <Link className="housing-card-art" href={'/store/' + e.id}>
                  {e.imageUrl ? <img src={e.imageUrl} alt={e.title} /> : <Home size={54} />}
                  <span className="tag">
                    {e.capacity === 0
                      ? 'غير متاح'
                      : housingAudiences[h.audience] || housingTypes[h.type] || 'سكن طلابي'}
                  </span>
                </Link>
                <div className="housing-card-body">
                  <h2>
                    <Link href={'/store/' + e.id}>{e.title}</Link>
                  </h2>
                  {e.location && (
                    <p>
                      <MapPin size={13} />
                      {e.location}
                    </p>
                  )}
                  <div className="housing-card-facts">
                    {h.rooms !== null && (
                      <span>
                        <DoorOpen size={13} />
                        {h.rooms} غرف
                      </span>
                    )}
                    {h.beds !== null && (
                      <span>
                        <BedDouble size={13} />
                        {h.beds} أسرّة
                      </span>
                    )}
                    {h.residents !== null && (
                      <span>
                        <Users size={13} />
                        {h.residents} مقيمين
                      </span>
                    )}
                  </div>
                  <footer>
                    <strong>
                      {money(e.priceMinor)}
                      <small> / شهر</small>
                    </strong>
                    <Link
                      href={'/store/' + e.id}
                      className="housing-card-open"
                      aria-label={'تفاصيل ' + e.title}
                    >
                      <ArrowLeft size={16} />
                    </Link>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty">
          <Home size={45} />
          <h2>لا توجد مساكن مطابقة حاليًا</h2>
          <p>تظهر هنا المساكن المنشورة ضمن نطاقك، جرّب تغيير التصفية.</p>
        </div>
      )}
    </section>
  );
}
