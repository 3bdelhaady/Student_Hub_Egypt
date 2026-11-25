import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  BedDouble,
  Users,
  Snowflake,
  Armchair,
  DoorOpen,
  Droplets,
  Flame,
  Zap,
  Wifi,
  CalendarCheck,
  Eye,
  Send,
} from 'lucide-react';
import type { PortalEntry } from '@/modules/portal/queries';
import { housingDetails, housingTypes, housingAudiences } from '@/modules/portal/housing';
import { HousingGallery } from './housing-gallery';
import { SaveEntryButton } from './portal-forms';
import { money } from './portal-catalog';
import { requestStatuses } from '@/modules/portal/policy';
import { studentLoginPath } from '@/modules/shared/return-path';
export function HousingDetail({
  entry: e,
  signedIn,
  saved,
  activeRequest,
}: {
  entry: PortalEntry;
  signedIn: boolean;
  saved: boolean;
  activeRequest?: { id: string; reference: string; status: string };
}) {
  const h = housingDetails(e.housingDetails),
    closed = e.capacity === 0 || !!(e.closesAt && e.closesAt <= new Date());
  const facts = [
    { label: 'عدد الغرف', value: h.rooms === null ? 'لم يحدد' : h.rooms + ' غرف', Icon: DoorOpen },
    { label: 'عدد الأسرّة', value: h.beds === null ? 'لم يحدد' : h.beds + ' أسرّة', Icon: BedDouble },
    {
      label: 'المقيمون',
      value: h.residents === null ? 'لم يحدد' : h.residents + ' طلاب',
      Icon: Users,
    },
    {
      label: 'الأثاث',
      value: h.furnished === 'yes' ? 'مفروش' : h.furnished === 'no' ? 'غير مفروش' : 'لم يحدد',
      Icon: Armchair,
    },
    {
      label: 'التكييف',
      value: h.cooling === 'yes' ? 'متوفر' : h.cooling === 'no' ? 'غير متوفر' : 'لم يحدد',
      Icon: Snowflake,
    },
    { label: 'حالة الطلب', value: closed ? 'غير متاح' : 'متاح للطلب', Icon: CalendarCheck },
  ];
  const amenities = [
    { label: 'مياه شرب', value: h.water, Icon: Droplets },
    { label: 'غاز طبيعي', value: h.gas, Icon: Flame },
    { label: 'كهرباء', value: h.electricity, Icon: Zap },
    { label: 'واي فاي', value: h.wifi, Icon: Wifi },
  ].filter((a) => a.value);
  return (
    <section className="housing-screen housing-detail-screen">
      <div className="breadcrumbs">
        <Link href="/store?kind=housing">
          <ArrowRight size={15} />
          السكن الطلابي
        </Link>
        <span>{e.title}</span>
      </div>
      <div className="housing-detail-grid">
        <div className="housing-main">
          <HousingGallery
            images={[
              ...new Set(
                [...e.imageUrls, e.imageUrl, ...h.gallery]
                  .filter(Boolean)
                  .map((url) =>
                    url.endsWith('/catalog/housing.svg') ? '/design/housing-room.jpg' : url,
                  ),
              ),
            ]}
            title={e.title}
          />
          <header className="housing-title-panel">
            <div>
              <span className="tag">
                {housingTypes[h.type] || 'سكن طلابي'}
                {h.audience ? '، ' + housingAudiences[h.audience] : ''}
              </span>
              <h1>{e.title}</h1>
              <p>
                <MapPin size={16} />
                {e.location || 'لم يضف الناشر موقع السكن'}
              </p>
            </div>
            <div className="housing-monthly">
              <strong>{money(e.priceMinor)}</strong>
              <small>شهريًا</small>
            </div>
          </header>
          <div className="housing-facts">
            {facts.map(({ label, value, Icon }) => (
              <div key={label}>
                <Icon size={22} />
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <section className="housing-amenities">
            <h2>المرافق المتاحة</h2>
            {amenities.length ? (
              <div>
                {amenities.map(({ label, Icon }) => (
                  <article key={label}>
                    <Icon size={22} />
                    <div>
                      <strong>{label}</strong>
                      <small>متوفر بالسكن</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="form-hint">لم يحدد الناشر المرافق بعد.</p>
            )}
          </section>
          <section className="housing-about">
            <h2>عن السكن</h2>
            <div className="prose">{e.description}</div>
          </section>
        </div>
        <aside className="housing-aside">
          <section className="housing-booking">
            <span className="tag">{closed ? 'غير متاح حاليًا' : 'متاح للطلب'}</span>
            <h2>احجز مكانك الدراسي</h2>
            <p>راجع تفاصيل السكن قبل إرسال الطلب</p>
            <dl>
              <div>
                <dt>الإيجار الشهري</dt>
                <dd>{money(e.priceMinor)}</dd>
              </div>
              <div>
                <dt>التأمين</dt>
                <dd>{money(Math.round(h.deposit * 100))}</dd>
              </div>
              <div>
                <dt>رسوم الخدمة</dt>
                <dd>{money(Math.round(h.serviceFee * 100))}</dd>
              </div>
            </dl>
            <div className="housing-total">
              <span>إجمالي أول شهر</span>
              <strong>{money(e.priceMinor + Math.round((h.deposit + h.serviceFee) * 100))}</strong>
            </div>
            {activeRequest ? (
              <div className="housing-request-state">
                <h3>لديك طلب قيد المتابعة</h3>
                <p>{requestStatuses[activeRequest.status]}</p>
                <Link className="button primary" href={'/requests/' + activeRequest.id}>
                  متابعة هذا الطلب
                </Link>
              </div>
            ) : closed ? (
              <p>الطلبات مغلقة لهذا السكن.</p>
            ) : signedIn ? (
              <>
                <Link href={'/store/' + e.id + '/checkout'} className="button primary">
                  <Send size={16} /> احجز الآن
                </Link>
                <Link
                  href={'/store/' + e.id + '/checkout?purpose=inspection'}
                  className="button secondary"
                >
                  <Eye size={16} /> طلب معاينة
                </Link>
              </>
            ) : (
              <Link className="button primary" href={studentLoginPath('/store/' + e.id)}>
                تسجيل الدخول للحجز
              </Link>
            )}
            {signedIn && <SaveEntryButton id={e.id} saved={saved} />}
          </section>
          <section className="housing-location location-preview">
            <MapPin size={25} />
            <h2>موقع السكن</h2>
            <p>{e.location || 'لم يحدد الموقع بعد'}</p>
            {h.mapUrl && (
              <a href={h.mapUrl} target="_blank" rel="noopener noreferrer" className="text-link">
                عرض موقع السكن
              </a>
            )}
          </section>
          <Link className="button secondary" href="/requests">
            طلبات المعاينة والحجز
          </Link>
        </aside>
      </div>
    </section>
  );
}
