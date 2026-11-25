import { ReviewDemoNotice } from './review-demo-notice';
import { studentCourseScopeSql } from '@/modules/agent-academic/queries';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  PlusCircle,
  Search,
  Users,
} from 'lucide-react';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  academicTeamProposals,
  courses,
  portalRequests,
  portalSaved,
  teamCourseSettings,
  institutions,
  faculties,
} from '@/db/schema';
import { studentAreaViewer } from '@/lib/session';
import { visiblePortalEntries } from '@/modules/portal/queries';
import { requestStatuses } from '@/modules/portal/policy';
import { teamApplicationsOpen } from '@/modules/academic-teams/policy';
import { studentLoginPath } from '@/modules/shared/return-path';
import { money } from './portal-catalog';
export type AcademicTeamParams = {
  course?: string;
  q?: string;
  category?: string;
  saved?: string;
  teamPage?: string;
};
export async function AcademicTeams({ params }: { params: AcademicTeamParams }) {
  const v = await studentAreaViewer();
  const all = (await visiblePortalEntries('team')).filter((e) => e.kind === 'team');
  const availableCourses =
    v?.membership?.status === 'active'
      ? await db
          .select()
          .from(courses)
          .where(
            and(
              eq(courses.universityId, v.membership.universityId),
              eq(courses.published, true),
              studentCourseScopeSql(v.membership),
            ),
          )
          .orderBy(asc(courses.title))
      : [];
  const enabledCourses =
    v?.membership?.status === 'active' && v.membership.facultyId
      ? await db
          .select({ id: teamCourseSettings.courseId })
          .from(teamCourseSettings)
          .innerJoin(institutions, eq(institutions.id, teamCourseSettings.institutionId))
          .innerJoin(faculties, eq(faculties.id, teamCourseSettings.facultyId))
          .where(
            and(
              eq(teamCourseSettings.facultyId, v.membership.facultyId),
              eq(teamCourseSettings.universityId, v.membership.universityId),
              eq(teamCourseSettings.enabled, true),
              eq(institutions.active, true),
              eq(faculties.active, true),
            ),
          )
      : [];
  const enabledIds = new Set(enabledCourses.map((c) => c.id));
  const saved = v
    ? await db
        .select({ entryId: portalSaved.entryId })
        .from(portalSaved)
        .where(eq(portalSaved.userId, v.user.id))
    : [];
  const savedIds = new Set(saved.map((row) => row.entryId));
  const q = (params.q || '').slice(0, 120),
    category = (params.category || '').slice(0, 80);
  const rows = all.filter(
    (e) =>
      (!q ||
        (
          e.title +
          ' ' +
          e.description +
          ' ' +
          (availableCourses.find((c) => c.id === e.teamCourseId)?.title || '')
        ).includes(q)) &&
      (!category || e.category === category) &&
      (!params.saved || savedIds.has(e.id)),
  );
  const choices = availableCourses
    .filter((c) => enabledIds.has(c.id))
    .map((c) => ({ id: c.id, title: c.title, category: c.category, instructor: c.instructor }));
  const groupId = (e: (typeof all)[number]) => e.teamCourseId || 'unassigned';
  const selected =
    choices.find((c) => c.id === params.course) ||
    choices.find((c) => rows.some((e) => groupId(e) === c.id)) ||
    choices[0];
  const displayedChoices = choices;
  const selectedRows = selected ? rows.filter((e) => groupId(e) === selected.id) : [];
  const pageCount = Math.max(1, Math.ceil(selectedRows.length / 2));
  const pageIndex = Math.max(
    0,
    Math.min(pageCount - 1, Number.parseInt(params.teamPage || '1', 10) - 1 || 0),
  );
  const shown = selectedRows.slice(pageIndex * 2, pageIndex * 2 + 2);
  const requests = v
    ? await db
        .select()
        .from(portalRequests)
        .where(
          and(
            eq(portalRequests.userId, v.user.id),
            inArray(portalRequests.kind, ['team', 'team_creation']),
          ),
        )
        .orderBy(desc(portalRequests.createdAt))
        .limit(100)
    : [];
  const awaiting = requests.filter((r) => ['pending', 'reviewing'].includes(r.status)).slice(0, 10);
  const proposals = awaiting.length
    ? await db
        .select()
        .from(academicTeamProposals)
        .where(
          inArray(
            academicTeamProposals.requestId,
            awaiting.map((r) => r.id),
          ),
        )
    : [];
  const activeRequests =
    v && all.length
      ? await db
          .select({
            id: portalRequests.id,
            entryId: portalRequests.entryId,
            status: portalRequests.status,
          })
          .from(portalRequests)
          .where(
            and(
              eq(portalRequests.userId, v.user.id),
              inArray(
                portalRequests.entryId,
                all.map((e) => e.id),
              ),
              inArray(portalRequests.status, ['pending', 'reviewing', 'accepted']),
            ),
          )
      : [];
  function destination(courseId = selected?.id, nextPage = 1, savedOnly = !!params.saved) {
    const query = new URLSearchParams({ kind: 'team' });
    if (courseId) query.set('course', courseId);
    if (q) query.set('q', q);
    if (category) query.set('category', category);
    if (savedOnly) query.set('saved', '1');
    if (nextPage > 1) query.set('teamPage', String(nextPage));
    return '/services?' + query;
  }
  const creationPath =
    '/services/new-team' +
    (selected && selected.id !== 'unassigned' ? '?course=' + encodeURIComponent(selected.id) : '');
  return (
    <section className="academic-teams">
      {all.some((e) => e.demo) && <ReviewDemoNotice />}
      <header className="academic-team-heading">
        <div>
          <h1>الفريق الأكاديمي</h1>
          <p>تصفح الفرق المنشورة، واطلب الانضمام إلى فريق أو اقترح فريقًا جديدًا لمشروعك.</p>
        </div>
        <Link className="button primary" href={v ? creationPath : studentLoginPath(creationPath)}>
          <PlusCircle size={18} />
          إنشاء فريق جديد
        </Link>
      </header>
      <details className="academic-team-filters" open={!!(q || category || params.saved)}>
        <summary>
          <Search size={16} />
          بحث وتصفية الفرق
        </summary>
        <form action="/services">
          <input type="hidden" name="kind" value="team" />
          {params.saved && <input type="hidden" name="saved" value="1" />}
          <label>
            بحث عن فريق
            <input name="q" defaultValue={q} maxLength={120} />
          </label>
          <label>
            التصنيف
            <select name="category" defaultValue={category}>
              <option value="">كل التصنيفات</option>
              {[...new Set(all.map((e) => e.category).filter(Boolean))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button className="button secondary">بحث</button>
          <Link className="text-link" href={destination(selected?.id, 1, !params.saved)}>
            {params.saved ? 'عرض الكل' : 'المحفوظات'}
          </Link>
          {(q || category || params.saved) && (
            <Link className="text-link" href="/services?kind=team">
              مسح الفلاتر
            </Link>
          )}
        </form>
      </details>
      {!v && (
        <p className="academic-team-info">
          سجّل الدخول بعضوية جامعية مفعّلة لرؤية فرق جامعتك ومقرراتها وإرسال طلب إنشاء فريق.
        </p>
      )}
      {v && v.membership?.status !== 'active' && (
        <p className="academic-team-info">
          تظهر فرق الجامعة ومقرراتها بعد تفعيل عضويتك.{' '}
          <Link className="text-link" href="/account?view=student">
            متابعة العضوية
          </Link>
        </p>
      )}
      {all.length === 500 && (
        <p className="academic-team-info">
          تُعرض أحدث 500 نتيجة متاحة فقط، الأعداد تخص النتائج المعروضة، وليست إجمالي كل الفرق في
          قاعدة البيانات.
        </p>
      )}
      <div className="academic-team-layout">
        <nav className="academic-team-courses" aria-label="اختيار مقرر الفرق">
          <h2 className="sr-only">اختر المقرر</h2>
          {choices.length ? (
            displayedChoices.map((c) => (
              <Link
                key={c.id}
                href={destination(c.id)}
                aria-current={selected?.id === c.id ? 'page' : undefined}
                className="academic-team-course"
              >
                <span className="academic-team-course-top">
                  <span className="tag">{c.category || 'مقرر منشور'}</span>
                  {selected?.id === c.id && <CheckCircle2 size={18} />}
                </span>
                <h3>{c.title}</h3>
                {enabledIds.has(c.id) && <span>إنشاء الفرق مفعّل</span>}
                {c.instructor && <p>اسم دكتور المقرر: {c.instructor}</p>}
                <span className="academic-team-course-bottom">
                  <span>
                    <Users size={14} />
                    {rows.filter((e) => groupId(e) === c.id).length}{' '}
                    {q || category || params.saved ? 'فريق مطابق' : 'فريق منشور'}
                  </span>
                  <ArrowLeft size={17} />
                </span>
              </Link>
            ))
          ) : (
            <div className="academic-team-panel">
              <BookOpen size={30} />
              <p>لا توجد مقررات أو فرق متاحة في نطاقك حاليًا.</p>
            </div>
          )}
        </nav>
        <div className="academic-team-results">
          {selected && enabledIds.has(selected.id) && (
            <Link
              className="button primary"
              href={'/services/new-team?course=' + encodeURIComponent(selected.id)}
            >
              إنشاء فريق لهذا المقرر
            </Link>
          )}
          <section aria-label="الفرق المتاحة للمقرر">
            <h2 className="sr-only">{selected?.title || 'الفرق المتاحة'}</h2>
            <nav className="academic-team-navigation" aria-label="صفحات الفرق">
              {pageIndex > 0 ? (
                <Link
                  className="button secondary"
                  aria-label="الفرق السابقة"
                  href={destination(selected?.id, pageIndex)}
                >
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button className="button secondary" disabled aria-label="الفرق السابقة">
                  <ArrowRight size={16} />
                </button>
              )}
              <span>
                {pageIndex + 1} من {pageCount}
              </span>
              {pageIndex < pageCount - 1 ? (
                <Link
                  className="button secondary"
                  aria-label="الفرق التالية"
                  href={destination(selected?.id, pageIndex + 2)}
                >
                  <ArrowLeft size={16} />
                </Link>
              ) : (
                <button className="button secondary" disabled aria-label="الفرق التالية">
                  <ArrowLeft size={16} />
                </button>
              )}
            </nav>
            {shown.length ? (
              <div className="academic-team-card-grid">
                {shown.map((e) => {
                  const request = activeRequests.find((r) => r.entryId === e.id),
                    open = teamApplicationsOpen(e);
                  return (
                    <article className="academic-team-card" key={e.id}>
                      <div className="academic-team-card-top">
                        <span className="academic-team-marker">
                          {e.teamMarker || <Users size={25} />}
                        </span>
                        <span className={'academic-team-status ' + (!open ? 'closed' : '')}>
                          {open ? 'التقديم متاح' : 'التقديم مغلق'}
                        </span>
                      </div>
                      <h3>
                        <Link href={'/services/' + e.id}>{e.title}</Link>
                      </h3>
                      <p>{e.description}</p>
                      <div className="academic-team-card-meta">
                        {e.capacity !== null && <span>{e.capacity} مقعد متاح للتقديم</span>}
                        {e.priceMinor > 0 && <span>رسوم منشورة: {money(e.priceMinor)}</span>}
                      </div>
                      <footer>
                        {request ? (
                          <Link className="text-link" href={'/requests/' + request.id}>
                            {requestStatuses[request.status]}، متابعة طلبك
                          </Link>
                        ) : (
                          <Link
                            className={'button ' + (open ? 'primary' : 'secondary')}
                            href={'/services/' + e.id + '#team-apply'}
                          >
                            {open ? 'طلب الانضمام' : 'عرض التفاصيل'}
                          </Link>
                        )}
                        <Link className="text-link" href={'/services/' + e.id}>
                          التفاصيل
                        </Link>
                      </footer>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="academic-team-panel academic-team-empty">
                <Users size={37} />
                <h3>
                  {q || category || params.saved
                    ? 'لا توجد فرق مطابقة لهذا الاختيار'
                    : 'لا توجد فرق منشورة لهذا المقرر بعد'}
                </h3>
                <p>
                  تعرض الصفحة الفرق المنشورة والمتاحة لنطاق عضويتك فقط، دون أسماء أعضاء أو أعداد
                  عضوية مفترضة.
                </p>
              </div>
            )}
          </section>
          <section className="academic-team-requests">
            <div className="section-heading">
              <h2>طلباتك الحديثة قيد المتابعة</h2>
              <Link className="text-link" href="/requests">
                كل طلباتي
              </Link>
            </div>
            {awaiting.length ? (
              <div className="academic-team-request-list">
                {awaiting.map((r) => {
                  const proposal = proposals.find((p) => p.requestId === r.id),
                    entry = all.find((e) => e.id === r.entryId),
                    course = availableCourses.find((c) => c.id === entry?.teamCourseId);
                  return (
                    <article key={r.id}>
                      <div>
                        <small>
                          {r.kind === 'team_creation' ? 'طلب إنشاء فريق' : 'طلب انضمام'}
                          {proposal
                            ? ' · ' + proposal.courseTitle
                            : course
                              ? ' · ' + course.title
                              : ''}
                        </small>
                        <h3>
                          <Link href={'/requests/' + r.id}>{r.subject}</Link>
                        </h3>
                        <time>
                          {r.createdAt.toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}
                        </time>
                      </div>
                      <span className={'status-pill status-' + r.status}>
                        {requestStatuses[r.status]}
                      </span>
                      <Link className="text-link" href={'/requests/' + r.id}>
                        متابعة الطلب
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="academic-team-panel">
                <p>
                  {v
                    ? 'لا توجد طلبات حديثة قيد المراجعة أو المتابعة.'
                    : 'سجّل الدخول لمتابعة طلباتك الخاصة.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
