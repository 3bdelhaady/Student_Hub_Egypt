import { OrganizationVolunteerForm } from './organization-volunteer-form';
import { ReviewDemoNotice } from './review-demo-notice';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, HeartHandshake, Search } from 'lucide-react';
import { and, asc, eq, inArray, or } from 'drizzle-orm';
import { db } from '@/db';
import {
  institutions,
  faculties,
  studentOrganizations,
  portalEntries,
  portalRequests,
  portalSaved,
  volunteerDivisions,
  volunteerRequestChoices,
} from '@/db/schema';
import { studentAreaViewer } from '@/lib/session';
import { visiblePortalEntries } from '@/modules/portal/queries';
import { volunteerApplicationsOpen } from '@/modules/volunteering/policy';
import { VolunteerApplicationPanel } from './volunteer-application-panel';
export async function Volunteering({
  params,
}: {
  params: {
    volunteer?: string;
    q?: string;
    category?: string;
    saved?: string;
    organization?: string;
  };
}) {
  const v = await studentAreaViewer();
  const all = await visiblePortalEntries('volunteer');
  const organizations =
    v?.membership?.status === 'active'
      ? await db
          .select({
            id: studentOrganizations.id,
            name: studentOrganizations.name,
            faculty: faculties.name,
          })
          .from(studentOrganizations)
          .innerJoin(institutions, eq(institutions.id, studentOrganizations.institutionId))
          .innerJoin(faculties, eq(faculties.id, studentOrganizations.facultyId))
          .where(
            and(
              eq(studentOrganizations.universityId, v.membership.universityId),
              or(
                eq(studentOrganizations.kind, 'student_activity'),
                and(
                  eq(studentOrganizations.kind, 'student_union'),
                  eq(studentOrganizations.facultyId, v.membership.facultyId || ''),
                ),
              ),
              eq(studentOrganizations.active, true),
              eq(institutions.active, true),
              eq(faculties.active, true),
            ),
          )
          .orderBy(asc(studentOrganizations.name))
      : [];
  const selectedOrganization = organizations.find((o) => o.id === params.organization);

  const directOrganization = selectedOrganization || organizations[0];
  const ids = all.map((e) => e.id);
  const attribution = ids.length
    ? await db
        .select({
          entryId: portalEntries.id,
          institutionName: institutions.name,
          organizationName: studentOrganizations.name,
        })
        .from(portalEntries)
        .innerJoin(institutions, eq(institutions.id, portalEntries.institutionId))
        .leftJoin(studentOrganizations, eq(studentOrganizations.id, portalEntries.organizationId))
        .where(inArray(portalEntries.id, ids))
    : [];
  const divisions = ids.length
    ? await db
        .select()
        .from(volunteerDivisions)
        .where(and(inArray(volunteerDivisions.entryId, ids), eq(volunteerDivisions.active, true)))
        .orderBy(asc(volunteerDivisions.position), asc(volunteerDivisions.id))
    : [];
  const saved = v
    ? await db
        .select({ entryId: portalSaved.entryId })
        .from(portalSaved)
        .where(eq(portalSaved.userId, v.user.id))
    : [];
  const savedIds = new Set(saved.map((r) => r.entryId));
  const q = (params.q || '').slice(0, 120),
    category = (params.category || '').slice(0, 80);
  const entries = all.filter((e) => {
    const provider = attribution.find((a) => a.entryId === e.id);
    return (
      (!selectedOrganization || e.organizationId === selectedOrganization.id) &&
      (!q ||
        (
          e.title +
          ' ' +
          e.description +
          ' ' +
          (provider?.organizationName || provider?.institutionName || '')
        ).includes(q)) &&
      (!category || e.category === category) &&
      (!params.saved || savedIds.has(e.id))
    );
  });
  const selected =
    entries.find((e) => e.id === params.volunteer) ||
    entries.find(
      (e) => volunteerApplicationsOpen(e) && divisions.some((d) => d.entryId === e.id),
    ) ||
    entries[0];
  const index = selected ? entries.findIndex((e) => e.id === selected.id) : 0,
    pairStart = Math.floor(index / 2) * 2;
  const shown = entries.slice(pairStart, pairStart + 2);
  const [request] =
    v && selected
      ? await db
          .select({
            id: portalRequests.id,
            reference: portalRequests.reference,
            status: portalRequests.status,
          })
          .from(portalRequests)
          .where(
            and(
              eq(portalRequests.userId, v.user.id),
              eq(portalRequests.entryId, selected.id),
              inArray(portalRequests.status, ['pending', 'reviewing', 'accepted']),
            ),
          )
          .limit(1)
      : [];
  const [choice] = request
    ? await db
        .select()
        .from(volunteerRequestChoices)
        .where(eq(volunteerRequestChoices.requestId, request.id))
        .limit(1)
    : [];
  function destination(id = selected?.id, savedOnly = !!params.saved) {
    const query = new URLSearchParams({ kind: 'volunteer' });
    if (id) query.set('volunteer', id);
    if (selectedOrganization) query.set('organization', selectedOrganization.id);
    if (q) query.set('q', q);
    if (category) query.set('category', category);
    if (savedOnly) query.set('saved', '1');
    return '/services?' + query;
  }
  return (
    <section className="volunteering">
      {all.some((e) => e.demo) && <ReviewDemoNotice />}
      <header className="volunteer-heading">
        <h1>الأنشطة التطوعية</h1>
        <p>اختر اتحاد الطلاب أو نشاطًا طلابيًا وأرسل طلب تطوع في أي وقت من العام.</p>
      </header>

      {organizations.length > 0 && (
        <form action="/services" className="volunteer-organization-picker">
          <input type="hidden" name="kind" value="volunteer" />
          <label>
            اتحاد الطلاب والأنشطة الطلابية بجامعتك
            <select name="organization" defaultValue={selectedOrganization?.id || ''}>
              <option value="">كل جهات الجامعة</option>

              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.faculty ? '، ' + o.faculty : ''}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary">عرض فرص الجهة</button>
          <p className="form-hint">
            يعرض اتحاد طلاب كليتك والأنشطة الطلابية في جامعتك، ويمكن إرسال طلبات التطوع طوال العام.
          </p>
        </form>
      )}

      {organizations.length > 0 && (
        <div className="volunteer-layout">
          <section className="volunteer-panel">
            <h2>اتحاد الطلاب والأنشطة الطلابية</h2>
            <div className="volunteer-opportunity-grid">
              {organizations
                .filter((o) => !params.organization || o.id === params.organization)
                .map((o) => (
                  <article className="volunteer-opportunity" key={o.id}>
                    <h3>{o.name}</h3>
                    <p>{o.faculty}</p>
                    <Link
                      className="button secondary"
                      href={'/services?kind=volunteer&organization=' + encodeURIComponent(o.id)}
                    >
                      اختيار الجهة
                    </Link>
                  </article>
                ))}
            </div>
          </section>
          {directOrganization && (
            <section className="volunteer-panel">
              <h2>{directOrganization.name}</h2>
              <p>طلبات التطوع متاحة طوال العام.</p>
              <OrganizationVolunteerForm
                key={directOrganization.id}
                organizationId={directOrganization.id}
              />
            </section>
          )}
        </div>
      )}
      {all.length > 0 && (
        <>
          <details className="volunteer-filters" open={!!(q || category || params.saved)}>
            <summary>
              <Search size={16} />
              بحث وتصفية فرص التطوع
            </summary>
            <form action="/services">
              <input type="hidden" name="kind" value="volunteer" />

              {params.saved && <input type="hidden" name="saved" value="1" />}

              <label>
                بحث عن فرصة أو جهة
                <input name="q" maxLength={120} defaultValue={q} />
              </label>
              <label>
                التصنيف
                <select name="category" defaultValue={category}>
                  <option value="">كل التصنيفات</option>

                  {[...new Set(all.map((e) => e.category).filter(Boolean))].map((c) => (
                    <option value={c} key={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button secondary">بحث</button>
              <Link className="text-link" href={destination(selected?.id, !params.saved)}>
                {params.saved ? 'عرض الكل' : 'المحفوظات'}
              </Link>

              {(q || category || params.saved) && (
                <Link className="text-link" href="/services?kind=volunteer">
                  مسح الفلاتر
                </Link>
              )}
            </form>
          </details>

          {all.length === 500 && (
            <p className="volunteer-info">تُعرض أحدث 500 فرصة متاحة فقط، وليس إجمالي كل السجلات.</p>
          )}

          <div className="volunteer-layout">
            <section className="volunteer-panel volunteer-opportunities">
              <header className="volunteer-panel-heading">
                <span className="volunteer-step">1</span>
                <h2>اختر الجهة أو الفرصة التي تود التطوع بها</h2>
                <nav aria-label="صفحات فرص التطوع">
                  {pairStart > 0 ? (
                    <Link
                      className="button secondary"
                      aria-label="الفرص السابقة"
                      href={destination(entries[pairStart - 2].id)}
                    >
                      <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <button className="button secondary" disabled aria-label="الفرص السابقة">
                      <ArrowRight size={15} />
                    </button>
                  )}

                  {pairStart + 2 < entries.length ? (
                    <Link
                      className="button secondary"
                      aria-label="الفرص التالية"
                      href={destination(entries[pairStart + 2].id)}
                    >
                      <ArrowLeft size={15} />
                    </Link>
                  ) : (
                    <button className="button secondary" disabled aria-label="الفرص التالية">
                      <ArrowLeft size={15} />
                    </button>
                  )}
                </nav>
              </header>

              {shown.length ? (
                <div className="volunteer-opportunity-grid">
                  {shown.map((entry) => {
                    const provider = attribution.find((a) => a.entryId === entry.id),
                      available =
                        volunteerApplicationsOpen(entry) &&
                        divisions.some((d) => d.entryId === entry.id);
                    return (
                      <article
                        className={
                          'volunteer-opportunity ' + (selected?.id === entry.id ? 'selected' : '')
                        }
                        key={entry.id}
                      >
                        <Link
                          className="volunteer-opportunity-select"
                          href={destination(entry.id)}
                          aria-current={selected?.id === entry.id ? 'page' : undefined}
                        >
                          <span className="volunteer-opportunity-top">
                            {entry.imageUrl ? (
                              <img src={entry.imageUrl} alt="" />
                            ) : (
                              <HeartHandshake size={32} />
                            )}

                            <CheckCircle2
                              className={
                                selected?.id === entry.id ? 'selected-check' : 'unselected-check'
                              }
                              size={19}
                            />
                          </span>
                          <h3>{entry.title}</h3>
                          <p>{entry.description}</p>
                          <small className="volunteer-provider">
                            {provider?.organizationName || provider?.institutionName}
                          </small>
                          <span className="volunteer-status">
                            {available
                              ? 'متاح للتقديم'
                              : !volunteerApplicationsOpen(entry)
                                ? 'التقديم مغلق'
                                : 'أقسام التقديم لم تُحدد بعد'}
                          </span>
                        </Link>
                        <Link className="text-link" href={'/services/' + entry.id}>
                          تفاصيل الفرصة
                        </Link>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="volunteer-empty">
                  <HeartHandshake size={40} />
                  <h3>
                    {q || category || params.saved
                      ? 'لا توجد فرص تطوع مطابقة'
                      : 'لا توجد فرص تطوع منشورة في نطاقك بعد'}
                  </h3>
                  <p>تظهر هنا الفرص المنشورة والمتاحة لعضويتك.</p>
                </div>
              )}
            </section>

            {selected ? (
              <VolunteerApplicationPanel
                entry={selected}
                divisions={divisions.filter((d) => d.entryId === selected.id)}
                signedIn={!!v}
                returnPath={destination(selected.id)}
                activeRequest={request}
                selectedDivision={choice?.divisionLabel}
              />
            ) : (
              <section className="volunteer-panel volunteer-empty">
                <h2>اختر فرصة متاحة أولًا</h2>
                <p>لن نعرض أقسامًا افتراضية أو نرسل طلبًا دون فرصة وقسم متاحين.</p>
              </section>
            )}
          </div>
        </>
      )}
      <p className="volunteer-info">
        طلباتك خاصة بك وبالمسؤولين المخولين عن الجهة، لا تعرض هذه الصفحة أسماء المتطوعين أو سجل
        عضوية مفترضًا.
        <Link className="text-link" href="/requests">
          متابعة طلباتي
        </Link>
      </p>
    </section>
  );
}
