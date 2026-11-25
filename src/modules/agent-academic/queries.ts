import { sql, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { courses, agentCourseScopes, institutionAgents } from '@/db/schema';
import { viewer } from '@/lib/session';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { activeAgent } from '@/modules/institution/policy';
import { hasSectionRight, type SectionRights } from '@/modules/institution/section-policy';
import type { Tx } from '@/modules/institution/service';
import { activeEntryScope } from '@/modules/portal/queries';
// Legacy university courses retain their existing audience. Agent-created courses require the assigned faculty.
export function studentCourseScopeSql(
  m: { status: string; universityId: string; facultyId: string | null } | undefined,
) {
  const allowed =
    m?.status === 'active' && m.facultyId
      ? sql`s.university_id=${m.universityId} AND s.faculty_id=${m.facultyId}`
      : sql`false`;
  return sql`(NOT EXISTS(SELECT 1 FROM agent_course_scopes s WHERE s.course_id=${courses.id}) OR EXISTS(SELECT 1 FROM agent_course_scopes s JOIN institutions i ON i.id=s.institution_id JOIN faculties f ON f.id=s.faculty_id JOIN student_organizations o ON o.id=s.organization_id WHERE s.course_id=${courses.id} AND i.active AND f.active AND o.active AND ${allowed}))`;
}
export async function courseInStudentScope(
  id: string,
  m: Parameters<typeof studentCourseScopeSql>[0],
  tx: Tx | typeof db = db,
) {
  return !!(
    await tx
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, id), studentCourseScopeSql(m)))
      .limit(1)
  ).length;
}
export async function academicActor(
  v: NonNullable<Awaited<ReturnType<typeof viewer>>>,
  tx: Tx | typeof db = db,
) {
  if (!isAgentMode(v)) return undefined;
  return (
    await tx
      .select()
      .from(institutionAgents)
      .where(eq(institutionAgents.userId, v.user.id))
      .for('share')
      .limit(1)
  )[0];
}
export async function canUseAgentCourse(
  v: NonNullable<Awaited<ReturnType<typeof viewer>>>,
  scope: typeof agentCourseScopes.$inferSelect,
  right: keyof SectionRights,
  tx: Tx | typeof db = db,
) {
  if (v.platformAdmin) return true;
  const a = await academicActor(v, tx);
  return (
    !!a &&
    ['student_union', 'student_affairs'].includes(a.department) &&
    activeAgent(a, await activeEntryScope(a, tx)) &&
    a.institutionId === scope.institutionId &&
    a.universityId === scope.universityId &&
    a.facultyId === scope.facultyId &&
    (a.department === 'student_affairs'
      ? right === 'canRead' || a[right]
      : hasSectionRight(a, 'academic', right))
  );
}
