import { courseInStudentScope } from '@/modules/agent-academic/queries';
import { studentAreaViewer } from '@/lib/session';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import {
  courses,
  resources,
  savedCourses,
  resourceProgress,
  assignmentSubmissions,
} from '@/db/schema';
import { eq, and, asc, ne } from 'drizzle-orm';
import { viewer } from '@/lib/session';
import { canReadAcademic } from '@/lib/policy';
import { externalUrlHost } from '@/modules/shared/url';
import { studentLoginPath } from '@/modules/shared/return-path';
import {
  LockKeyhole,
  BookOpen,
  FileText,
  ArrowLeft,
  PlayCircle,
  ClipboardList,
  ListTree,
  ExternalLink,
  CalendarClock,
  ChevronDown,
} from 'lucide-react';
import {
  SaveCourseButton,
  CompleteResourceButton,
  AssignmentForm,
} from '@/components/learning-actions';
import { Empty } from '@/components/ui';

const kindOrder = ['lecture', 'file', 'section', 'assignment', 'video'] as const;
type ResourceKind = (typeof kindOrder)[number];
const kindLabels: Record<ResourceKind, string> = {
  lecture: 'المحاضرات',
  file: 'المذكرات والملفات',
  section: 'الأقسام',
  assignment: 'الواجبات',
  video: 'الفيديو',
};
const kindIcons: Record<ResourceKind, typeof BookOpen> = {
  lecture: BookOpen,
  file: FileText,
  section: ListTree,
  assignment: ClipboardList,
  video: PlayCircle,
};
const dueFormatter = new Intl.DateTimeFormat('ar-EG', {
  timeZone: 'Africa/Cairo',
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default async function Course({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  await studentAreaViewer();
  const requestedKind = (await searchParams).kind;
  const kind = kindOrder.find((k) => k === requestedKind);

  const { id } = await params;
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.published, true)))
    .limit(1);
  if (!course) notFound();
  const v = await viewer();
  if (!(await courseInStudentScope(id, v?.membership))) notFound();
  const allowed = canReadAcademic(v?.membership, course.universityId);
  const items = allowed
    ? await db
        .select()
        .from(resources)
        .where(eq(resources.courseId, id))
        .orderBy(asc(resources.position))
    : [];
  const saved = v
    ? await db
        .select()
        .from(savedCourses)
        .where(and(eq(savedCourses.userId, v.user.id), eq(savedCourses.courseId, id)))
        .limit(1)
    : [];
  const progressItems = items.filter((r) => r.kind !== 'section');
  const completed =
    allowed && v
      ? await db
          .select({ resourceId: resourceProgress.resourceId })
          .from(resourceProgress)
          .innerJoin(resources, eq(resourceProgress.resourceId, resources.id))
          .where(
            and(
              eq(resourceProgress.userId, v.user.id),
              eq(resources.courseId, id),
              ne(resources.kind, 'section'),
            ),
          )
      : [];
  const completedIds = new Set(completed.map((r) => r.resourceId));
  const submissions =
    allowed && v
      ? await db
          .select({ submission: assignmentSubmissions })
          .from(assignmentSubmissions)
          .innerJoin(resources, eq(assignmentSubmissions.resourceId, resources.id))
          .where(and(eq(assignmentSubmissions.userId, v.user.id), eq(resources.courseId, id)))
      : [];
  const submissionByResource = new Map(
    submissions.map((s) => [s.submission.resourceId, s.submission]),
  );
  const presentKinds = kindOrder.filter((k) => items.some((r) => r.kind === k));
  const tabKinds =
    kind && !presentKinds.includes(kind)
      ? kindOrder.filter((k) => presentKinds.includes(k) || k === kind)
      : presentKinds;
  const now = new Date();
  return (
    <>
      <div className="page-top course-workspace-hero">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/courses">المقررات</Link>
            <ArrowLeft size={12} />
            <span>{course.title}</span>
          </div>
          <span className="course-published">المساحة الأكاديمية</span>
          <h1>{course.title}</h1>
          {course.code && (
            <p>
              كود المقرر: <bdi>{course.code}</bdi>
            </p>
          )}
          <p>{course.description}</p>
        </div>
      </div>
      <section className="section container split-layout">
        <div>
          {allowed ? (
            <>
              <nav className="resource-tabs" aria-label="نوع موارد المقرر">
                <Link href={`/courses/${id}`} aria-current={!kind ? 'page' : undefined}>
                  كل الموارد
                </Link>
                {tabKinds.map((k) => (
                  <Link
                    key={k}
                    href={`/courses/${id}?kind=${k}`}
                    aria-current={kind === k ? 'page' : undefined}
                  >
                    {kindLabels[k]}
                  </Link>
                ))}
              </nav>
              <div className="resource-list">
                {items
                  .filter((r) => !kind || r.kind === kind)
                  .map((r) => {
                    const Icon = kindIcons[r.kind as ResourceKind] || FileText;
                    if (r.kind === 'section')
                      return (
                        <div className="resource-section-heading" key={r.id}>
                          <ListTree size={19} />
                          <div>
                            <h2>{r.title}</h2>
                            {r.body ? <p>{r.body}</p> : null}
                          </div>
                        </div>
                      );
                    const submission = submissionByResource.get(r.id);
                    const overdue =
                      r.kind === 'assignment' && !submission && r.dueAt && new Date(r.dueAt) < now;
                    return (
                      <details className="resource" key={r.id}>
                        <summary>
                          <Icon size={19} />
                          <span className="resource-summary-copy">
                            <strong>{r.title}</strong>
                            <small className={overdue ? 'resource-summary-late' : ''}>
                              {r.kind === 'assignment'
                                ? submission
                                  ? 'تم التسليم ✓'
                                  : overdue
                                    ? 'فات الموعد'
                                    : 'واجب بانتظار التسليم'
                                : kindLabels[r.kind as ResourceKind]}
                              {completedIds.has(r.id) ? ' · مكتمل' : ''}
                              {r.url ? ` · ${externalUrlHost(r.url)}` : ''}
                            </small>
                          </span>
                          <span className="resource-summary-action">
                            عرض المحتوى <ChevronDown size={14} />
                          </span>
                        </summary>
                        <div className="prose">{r.body}</div>
                        {r.kind === 'assignment' && r.dueAt && (
                          <p className={`resource-due${overdue ? ' late' : ''}`}>
                            <CalendarClock size={16} />
                            موعد التسليم: {dueFormatter.format(new Date(r.dueAt))} (القاهرة)
                            {overdue ? '، انتهى الموعد، ويمكنك التسليم للمراجعة.' : ''}
                          </p>
                        )}
                        {r.url && (
                          <a
                            className="button secondary resource-link"
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                          >
                            <ExternalLink size={16} />
                            {r.kind === 'video' ? 'مشاهدة الفيديو' : 'فتح الرابط'} (
                            {externalUrlHost(r.url)})
                          </a>
                        )}
                        {r.kind === 'assignment' && (
                          <AssignmentForm
                            resourceId={r.id}
                            initialBody={submission?.body || ''}
                            initialUrl={submission?.url || ''}
                            updatedAt={submission?.updatedAt || null}
                          />
                        )}
                        <CompleteResourceButton
                          resourceId={r.id}
                          completed={completedIds.has(r.id)}
                        />
                      </details>
                    );
                  })}
              </div>
              {items.length > 0 && kind && !items.some((r) => r.kind === kind) && (
                <Empty
                  title="لا توجد موارد من هذا النوع."
                  body="اختر كل الموارد لمشاهدة المحتوى المتاح."
                />
              )}
              {!items.length && (
                <Empty title="المحتوى بيتجهز." body="لم يضف فريق المحتوى موارد لهذا المقرر بعد." />
              )}
            </>
          ) : (
            <div className="locked-panel">
              <LockKeyhole size={35} />
              <h2>المعرفة هنا، وخطوتك بسيطة.</h2>
              <p>
                {v
                  ? 'المحاضرات متاحة بعد الموافقة على عضويتك في مجتمع هذا المقرر.'
                  : 'سجّل دخولك، وأكمل الانضمام لمجتمعك للوصول إلى الموارد الأكاديمية.'}
              </p>
              <Link
                className="button primary"
                href={
                  v ? '/account' : studentLoginPath(`/courses/${id}${kind ? '?kind=' + kind : ''}`)
                }
              >
                {v ? 'تابع حالة حسابك' : 'تسجيل الدخول'}
                <ArrowLeft size={17} />
              </Link>
            </div>
          )}
        </div>
        <aside className="course-workspace-side">
          {allowed && progressItems.length > 0 && (
            <div className="course-progress-card">
              <div>
                <span>معدل الإنجاز</span>
                <strong>{Math.round((completed.length / progressItems.length) * 100)}%</strong>
              </div>
              <progress
                max={progressItems.length}
                value={completed.length}
                aria-label="تقدمك في المقرر"
              />
              <div className="course-progress-totals">
                <p>
                  {completed.length} من {progressItems.length} موارد مكتملة
                </p>
                <p>
                  {
                    items.filter(
                      (item) => item.kind === 'assignment' && submissionByResource.has(item.id),
                    ).length
                  }{' '}
                  من {items.filter((item) => item.kind === 'assignment').length} واجبات مسلّمة
                </p>
              </div>
              <small>تقدمك الشخصي، وليس تقييمًا رسميًا.</small>
            </div>
          )}
          <div className="course-instructor-card">
            <h3>اسم دكتور المقرر</h3>
            <div className="course-instructor-identity">
              <span>
                <BookOpen size={23} aria-hidden="true" />
              </span>
              <strong>{course.instructor}</strong>
            </div>
            {v ? (
              <SaveCourseButton courseId={id} saved={saved.length > 0} />
            ) : (
              <Link className="text-link" href={studentLoginPath(`/courses/${id}`)}>
                سجّل دخولك لحفظ المقرر
              </Link>
            )}
            <hr className="divider" />

            <Link className="button secondary" href="/courses?view=manage">
              استكشف مقررًا آخر
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
