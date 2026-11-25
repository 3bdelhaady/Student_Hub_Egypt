import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { courses, resources, agentCourseScopes } from '@/db/schema';
import { eq, asc, desc, and } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { canUseAgentCourse, academicActor } from '@/modules/agent-academic/queries';
import { hasSectionRight } from '@/modules/institution/section-policy';
import { activeEntryScope } from '@/modules/portal/queries';
import { activeAgent } from '@/modules/institution/policy';
import { CourseForm, ResourceForm } from '@/components/forms';
import { DeleteAgentResource } from '@/components/agent-academic-forms';
import { saveAgentCourse, saveAgentResource } from '@/modules/agent-academic/actions';
export const metadata = { title: 'مساحة العمل الأكاديمية للوكيل' };
export default async function Academic({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; new?: string; resource?: string }>;
}) {
  const v = await requireViewer(),
    p = await searchParams,
    a = await academicActor(v);
  if (
    !v.platformAdmin &&
    (!a ||
      !['student_union', 'student_affairs'].includes(a.department) ||
      !activeAgent(a, await activeEntryScope(a)) ||
      (a.department !== 'student_affairs' && !hasSectionRight(a, 'academic', 'canRead')))
  )
    notFound();
  const all = await db
    .select({ course: courses, scope: agentCourseScopes })
    .from(agentCourseScopes)
    .innerJoin(courses, eq(courses.id, agentCourseScopes.courseId))
    .where(
      v.platformAdmin
        ? undefined
        : and(
            eq(agentCourseScopes.institutionId, a!.institutionId),
            eq(agentCourseScopes.universityId, a!.universityId!),
            eq(agentCourseScopes.facultyId, a!.facultyId!),
          ),
    )
    .orderBy(desc(courses.createdAt))
    .limit(500);
  const rows = [];
  for (const row of all) if (await canUseAgentCourse(v, row.scope, 'canRead')) rows.push(row);
  const selected = p.course ? rows.find((r) => r.course.id === p.course) : undefined;
  if (p.course && !selected) notFound();
  const canCreate = a?.department === 'student_affairs' && a.canEdit;
  if (p.new && !canCreate) notFound();
  const editable = selected
    ? await canUseAgentCourse(v, selected.scope, 'canEdit')
    : !!a &&
      (a.department === 'student_affairs' ? a.canEdit : hasSectionRight(a, 'academic', 'canEdit'));
  const publish = selected
    ? await canUseAgentCourse(v, selected.scope, 'canPublish')
    : !!a &&
      (a.department === 'student_affairs'
        ? a.canPublish
        : hasSectionRight(a, 'academic', 'canPublish'));
  const canChange = editable && (!selected?.course.published || publish);
  if ((p.new || p.resource) && !canChange) notFound();
  const items = selected
    ? await db
        .select()
        .from(resources)
        .where(eq(resources.courseId, selected.course.id))
        .orderBy(asc(resources.position))
    : [];
  const resource =
    p.resource && p.resource !== 'new' ? items.find((r) => r.id === p.resource) : undefined;
  if (p.resource && p.resource !== 'new' && !resource) notFound();
  return (
    <section className="portal-screen agent-academic">
      <div className="section-heading">
        <div>
          <h1>مساحة العمل الأكاديمية</h1>
          <p>
            كل المقررات المسندة إلى كليتك ومواردها، بصلاحيات مستقلة للقراءة والتعديل والنشر. إضافة
            وتعديل بيانات المقررات متاحان لشؤون الطلاب فقط.
          </p>
        </div>
      </div>
      {all.length === 500 && <p>تُعرض أحدث 500 سجل فقط.</p>}
      {p.new ? (
        <CourseForm submitAction={saveAgentCourse} canPublish={publish} />
      ) : selected ? (
        <>
          <nav className="tab-row">
            <Link href="/manage/academic">كل المقررات</Link>
            {canChange && (
              <Link href={'/manage/academic?course=' + selected.course.id + '&resource=new'}>
                إضافة مورد
              </Link>
            )}
          </nav>
          <h2>{selected.course.title}</h2>
          <p>{selected.course.description}</p>
          <p>{selected.course.published ? 'منشور' : 'مسودة'}</p>
          {p.resource ? (
            <>
              <h3>{resource ? 'تعديل المورد' : 'إضافة مورد'}</h3>
              <ResourceForm
                submitAction={saveAgentResource}
                courses={[selected.course]}
                value={resource}
              />
              {resource && <DeleteAgentResource id={resource.id} courseId={selected.course.id} />}
            </>
          ) : (
            <>
              <div className="portal-card-grid">
                {items.map((r) => (
                  <article className="portal-form-section" key={r.id}>
                    <h3>{r.title}</h3>
                    <p>
                      {
                        {
                          lecture: 'محاضرة',
                          file: 'ملف',
                          section: 'قسم',
                          assignment: 'واجب',
                          video: 'فيديو',
                        }[r.kind]
                      }{' '}
                      · {r.position}
                    </p>
                    {canChange && (
                      <Link
                        href={'/manage/academic?course=' + selected.course.id + '&resource=' + r.id}
                      >
                        تعديل المورد أو حذفه
                      </Link>
                    )}
                  </article>
                ))}
              </div>
              {!items.length && <p>لا توجد موارد لهذا المقرر بعد.</p>}
              {canChange && a?.department === 'student_affairs' && (
                <>
                  <h3>تعديل بيانات المقرر</h3>
                  <CourseForm
                    key={selected.course.id}
                    submitAction={saveAgentCourse}
                    value={selected.course}
                    canPublish={publish}
                  />
                </>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {canCreate && (
            <Link className="button primary" href="/manage/academic?new=1">
              إضافة مقرر
            </Link>
          )}
          <div className="portal-card-grid">
            {rows.map(({ course: c }) => (
              <article className="portal-form-section" key={c.id}>
                <h2>{c.title}</h2>
                <p>{c.published ? 'منشور' : 'مسودة'}</p>
                <Link href={'/manage/academic?course=' + c.id}>فتح المقرر</Link>
              </article>
            ))}
          </div>
          {!rows.length && (
            <div className="portal-empty">
              <h2>لا توجد مقررات مسندة إلى كليتك بعد</h2>
              <p>تضيف شؤون الطلاب مقررات الكلية، ثم تظهر هنا للقراءة أو التعديل حسب صلاحياتك.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
