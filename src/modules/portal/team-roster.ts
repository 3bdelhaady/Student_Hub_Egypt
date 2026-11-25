import { isAgentMode } from '@/modules/identity/mode-policy';
import { db } from '@/db';
import { academicTeamMembers, user, portalEntries, courses, teamCourseSettings } from '@/db/schema';
import { and, eq, inArray, asc } from 'drizzle-orm';
import { studentCourseScopeSql } from '@/modules/agent-academic/queries';
import { canReadPortal } from './management-policy';
import { activeEntryScope, canReadPortalEntry } from './queries';
import type { viewer } from '@/lib/session';
type Viewer = NonNullable<Awaited<ReturnType<typeof viewer>>>;
export async function managedTeamCourses(v: Viewer) {
  const a = v.institutionAgent;
  if (
    !v.platformAdmin &&
    (!isAgentMode(v) ||
      !a ||
      a.status !== 'active' ||
      !a.facultyId ||
      !a.universityId ||
      !(await activeEntryScope(a)))
  )
    return [];
  const rows = await db
    .select({ course: courses, setting: teamCourseSettings })
    .from(teamCourseSettings)
    .innerJoin(courses, eq(courses.id, teamCourseSettings.courseId))
    .where(
      and(
        eq(teamCourseSettings.enabled, true),
        eq(courses.published, true),
        v.platformAdmin ? undefined : eq(courses.universityId, a!.universityId!),
        v.platformAdmin
          ? undefined
          : studentCourseScopeSql({
              status: 'active',
              universityId: a!.universityId!,
              facultyId: a!.facultyId,
            }),
        v.platformAdmin
          ? undefined
          : and(
              eq(teamCourseSettings.facultyId, a!.facultyId!),
              eq(teamCourseSettings.institutionId, a!.institutionId),
            ),
      ),
    )
    .orderBy(asc(courses.title));
  return rows.filter(
    (r) =>
      v.platformAdmin ||
      canReadPortal(
        a,
        {
          institutionId: r.setting.institutionId,
          facultyId: r.setting.facultyId,
          universityId: r.setting.universityId,
          department: 'student_union',
          kind: 'team',
          organizationId: a?.organizationId,
        },
        true,
      ),
  );
}
export async function managedTeamRoster(v: Viewer, courseId: string, teamId?: string) {
  const allowed = await managedTeamCourses(v);
  if (!allowed.some((r) => r.course.id === courseId)) return null;
  const candidates = await db
    .select()
    .from(portalEntries)
    .where(
      and(
        eq(portalEntries.kind, 'team'),
        eq(portalEntries.teamCourseId, courseId),
        eq(portalEntries.archived, false),
        teamId ? eq(portalEntries.id, teamId) : undefined,
      ),
    )
    .orderBy(asc(portalEntries.title));
  const teams = [];
  for (const e of candidates) if (await canReadPortalEntry(v, e)) teams.push(e);
  if (teamId && !teams.length) return null;
  const members = teams.length
    ? await db
        .select({
          entryId: academicTeamMembers.entryId,
          userId: user.id,
          name: user.name,
          studentCode: user.studentCode,
          role: academicTeamMembers.role,
        })
        .from(academicTeamMembers)
        .innerJoin(user, eq(user.id, academicTeamMembers.userId))
        .where(
          inArray(
            academicTeamMembers.entryId,
            teams.map((t) => t.id),
          ),
        )
        .orderBy(asc(user.name), asc(user.id))
    : [];
  return { teams, members };
}
export { teamRosterCsv } from './roster-csv';
