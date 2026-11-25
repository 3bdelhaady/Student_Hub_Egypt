import { studentCourseScopeSql } from '@/modules/agent-academic/queries';
import Link from 'next/link';
import { and, asc, eq } from 'drizzle-orm';
import { ArrowRight } from 'lucide-react';
import { db } from '@/db';
import { courses, teamCourseSettings, institutions, faculties } from '@/db/schema';
import { requireStudentViewer } from '@/lib/session';
import { AcademicTeamCreationForm } from '@/components/academic-team-creation-form';
export const metadata = { title: 'طلب إنشاء فريق أكاديمي' };
export default async function NewTeam({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const v = await requireStudentViewer('/services/new-team');
  const params = await searchParams;
  const available =
    v.membership?.status === 'active' && v.membership.facultyId
      ? await db
          .select({
            id: courses.id,
            title: courses.title,
            maxMembers: teamCourseSettings.maxMembers,
            conditions: teamCourseSettings.conditions,
            approvalRequired: teamCourseSettings.approvalRequired,
          })
          .from(courses)
          .innerJoin(
            teamCourseSettings,
            and(
              eq(teamCourseSettings.courseId, courses.id),
              eq(teamCourseSettings.facultyId, v.membership.facultyId),
            ),
          )
          .innerJoin(institutions, eq(institutions.id, teamCourseSettings.institutionId))
          .innerJoin(faculties, eq(faculties.id, teamCourseSettings.facultyId))
          .where(
            and(
              eq(courses.universityId, v.membership.universityId),
              eq(courses.published, true),
              eq(teamCourseSettings.enabled, true),
              eq(institutions.active, true),
              eq(faculties.active, true),
              studentCourseScopeSql(v.membership),
            ),
          )
          .orderBy(asc(courses.title))
      : [];
  return (
    <section className="academic-team-new">
      <Link className="text-link" href="/services?kind=team">
        <ArrowRight size={16} />
        الفرق الأكاديمية
      </Link>
      <div className="academic-team-creation-panel">
        <header>
          <h1>إنشاء فريق جديد</h1>
          <p>اقترح فريقًا أكاديميًا جديدًا للتعاون في المشاريع، وتابع مراجعة طلبك.</p>
        </header>
        {available.length ? (
          <AcademicTeamCreationForm courses={available} initialCourseId={params.course} />
        ) : (
          <div className="notice">
            <div>
              <h2>
                {v.membership?.status === 'active'
                  ? 'لم يفعّل المنسق إنشاء الفرق لأي مقرر متاح لك بعد'
                  : 'تحتاج إلى عضوية جامعية مفعّلة'}
              </h2>
              <p>يجب أن يفعّل المنسق الفرق للمقرر ويحدد الحد الأقصى للأعضاء والشروط.</p>
              <Link className="text-link" href="/account?view=student">
                متابعة عضويتك
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
