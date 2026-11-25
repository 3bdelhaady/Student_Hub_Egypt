import { notFound } from 'next/navigation';
import { and, eq, asc } from 'drizzle-orm';
import { db } from '@/db';
import { courses, teamCourseSettings } from '@/db/schema';
import { requireViewer } from '@/lib/session';
import { academicActor, studentCourseScopeSql } from '@/modules/agent-academic/queries';
import { activeEntryScope } from '@/modules/portal/queries';
import { hasSectionRight } from '@/modules/institution/section-policy';
import { TeamCourseSettingsForm } from '@/components/team-course-settings-form';
export const metadata = { title: 'تفعيل فريق أكاديمي لمقرر دراسي' };
export default async function TeamSettings() {
  const v = await requireViewer(),
    a = await academicActor(v);
  if (
    !a ||
    !a.facultyId ||
    !a.universityId ||
    a.department !== 'student_union' ||
    a.status !== 'active' ||
    !hasSectionRight(a, 'team', 'canEdit') ||
    !(await activeEntryScope(a))
  )
    notFound();
  const rows = await db
    .select({ course: courses, setting: teamCourseSettings })
    .from(courses)
    .leftJoin(
      teamCourseSettings,
      and(
        eq(teamCourseSettings.courseId, courses.id),
        eq(teamCourseSettings.facultyId, a.facultyId),
      ),
    )
    .where(
      and(
        eq(courses.universityId, a.universityId),
        eq(courses.published, true),
        studentCourseScopeSql({
          status: 'active',
          universityId: a.universityId,
          facultyId: a.facultyId,
        }),
      ),
    )
    .orderBy(asc(courses.title));
  return (
    <section className="portal-screen">
      <h1>تفعيل فريق أكاديمي لمقرر دراسي</h1>
      <p>
        الطالب يختار من المقررات المفعّلة هنا فقط. الرمز A ثم B ثم C يُعيّن تلقائيًا لكل مقرر. لا تتغير
        الفرق القائمة عند تعديل الشروط.
      </p>
      {!!rows.length && (
        <article className="portal-form-section">
          <h2>تفعيل الفريق الأكاديمي</h2>
          <TeamCourseSettingsForm
            courses={rows.map(({ course: c, setting: s }) => ({
              id: c.id,
              title: c.title,
              setting: s || undefined,
            }))}
          />
        </article>
      )}
      {!rows.length && <p>لا توجد مقررات منشورة في نطاق كليتك.</p>}
    </section>
  );
}
