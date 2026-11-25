import Link from 'next/link';
import {
  BriefcaseBusiness,
  GraduationCap,
  BookOpen,
  MapPin,
  ArrowRight,
  Search,
} from 'lucide-react';
import { studentAreaViewer } from '@/lib/session';
import { visiblePortalEntries } from '@/modules/portal/queries';
import {
  demoOpportunities,
  opportunityLabels,
  opportunityTypes,
  opportunityType,
  type Opportunity,
} from '@/modules/portal/opportunities';
import { OpportunityApplication } from './opportunity-application';
const icons = { job: BriefcaseBusiness, internship: BookOpen, scholarship: GraduationCap };
export async function StudentLink({
  params,
}: {
  params: { q?: string; category?: string; opportunity?: string; demos?: string; apply?: string };
}) {
  const v = await studentAreaViewer();
  const real = (await visiblePortalEntries('service')).filter((e) =>
    opportunityType(e.opportunityType),
  );
  const all: Opportunity[] = [...real, ...(process.env.VERCEL ? [] : demoOpportunities)];
  const selected = all.find((e) => e.id === params.opportunity);
  const entries = all.filter(
    (e) =>
      (!params.q ||
        (e.title + ' ' + e.description + ' ' + e.provider + ' ' + e.location)
          .toLocaleLowerCase()
          .includes(params.q.toLocaleLowerCase())) &&
      (!params.category || e.opportunityType === params.category),
  );
  function destination(id?: string) {
    const q = new URLSearchParams({ kind: 'service' });
    if (params.q) q.set('q', params.q);
    if (params.category) q.set('category', params.category);
    if (id) q.set('opportunity', id);
    return '/services?' + q;
  }
  return (
    <section className="student-link-screen">
      <header className="student-link-heading">
        <h1>رابط الطلاب</h1>
        <p>افتح لنفسك أبواب المستقبل مع فرص العمل والتدريب والمنح.</p>
      </header>
      <form className="student-link-filters" action="/services">
        <input type="hidden" name="kind" value="service" />
        <label>
          <span>
            <Search size={16} /> البحث في الفرص
          </span>
          <input
            name="q"
            defaultValue={params.q || ''}
            maxLength={120}
            placeholder="المسمى، الجهة أو المكان"
          />
        </label>
        <label>
          نوع الفرصة
          <select name="category" defaultValue={params.category || ''}>
            <option value="">كل الفرص</option>
            {opportunityTypes.map((t) => (
              <option key={t} value={t}>
                {opportunityLabels[t]}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary">بحث</button>
        {(params.q || params.category) && (
          <Link
            href={
              params.demos === 'off' ? '/services?kind=service&demos=off' : '/services?kind=service'
            }
          >
            مسح التصفية
          </Link>
        )}
      </form>
      {params.opportunity && !selected && (
        <p role="status">هذه الفرصة غير متاحة، اختر فرصة أخرى من القائمة.</p>
      )}
      {selected && (
        <article className="student-link-detail" aria-labelledby="opportunity-title">
          <Link className="text-link" href={destination()}>
            <ArrowRight size={16} />
            رجوع للفرص
          </Link>
          <span className="tag">
            {opportunityLabels[opportunityType(selected.opportunityType)!]}
          </span>
          <h2 id="opportunity-title">{selected.title}</h2>
          <p className="student-link-provider">{selected.provider || 'الجهة موضحة في التفاصيل'}</p>
          <p>
            <MapPin size={16} />
            {selected.location || 'لم يُحدد المكان'}
          </p>
          <h3>عن الفرصة</h3>
          <div className="prose">{selected.description}</div>
          <h3>الشروط والمتطلبات</h3>
          <div className="prose">
            {selected.requirements || 'راجع تفاصيل الإعلان أو تواصل مع المسؤول من خلال الطلب.'}
          </div>
          {selected.closesAt && (
            <p>
              آخر موعد:{' '}
              {selected.closesAt.toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}
            </p>
          )}
          {params.apply === selected.id ? (
            <OpportunityApplication opportunity={selected} viewer={v} />
          ) : (
            <Link
              className="button primary"
              href={destination(selected.id) + '&apply=' + selected.id}
            >
              إرسال بياناتي للتقديم
            </Link>
          )}
        </article>
      )}
      {opportunityTypes.map((type) => {
        const group = entries.filter((e) => e.opportunityType === type);
        const Icon = icons[type];
        return (
          <section
            className={'student-link-section ' + type}
            key={type}
            aria-labelledby={'opportunity-' + type}
          >
            <h2 id={'opportunity-' + type}>{opportunityLabels[type]}</h2>
            {group.length ? (
              <div className="student-link-grid">
                {group.map((e) => (
                  <article className="student-link-card" key={e.id}>
                    <div className="student-link-card-top">
                      <span className="student-link-icon">
                        <Icon size={22} />
                      </span>
                      <span>{e.location || 'غير محدد'}</span>
                    </div>
                    <h3>{e.title}</h3>
                    <p className="student-link-provider">
                      {e.provider || 'تفاصيل الجهة داخل الإعلان'}
                    </p>
                    <p>{e.description}</p>
                    <div className="student-link-card-tags">
                      <span>{e.category || opportunityLabels[type]}</span>
                    </div>
                    <Link
                      className={'button ' + (type === 'job' ? 'primary' : 'secondary')}
                      href={destination(e.id)}
                      aria-label={'عرض التفاصيل: ' + e.title}
                    >
                      عرض التفاصيل
                    </Link>
                    <Link
                      className="button primary"
                      href={destination(e.id) + '&apply=' + e.id}
                      aria-label={'إرسال بياناتي للتقديم: ' + e.title}
                    >
                      إرسال بياناتي للتقديم
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="student-link-empty">لا توجد فرص مطابقة في هذا القسم.</p>
            )}
          </section>
        );
      })}
    </section>
  );
}
