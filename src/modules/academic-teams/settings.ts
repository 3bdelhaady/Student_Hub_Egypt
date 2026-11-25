import { and, eq } from 'drizzle-orm';

import {
  teamCourseSettings,
  teamCourseCounters,
  institutions,
  faculties,
  portalEntries,
  academicTeamProposals,
} from '@/db/schema';
import type { Tx } from '@/modules/institution/service';
import { teamLetter } from './policy';
export async function allocateTeamMarker(tx: Tx, courseId: string, facultyId: string) {
  const [setting] = await tx
    .select()
    .from(teamCourseSettings)
    .where(
      and(eq(teamCourseSettings.courseId, courseId), eq(teamCourseSettings.facultyId, facultyId)),
    )
    .for('update')
    .limit(1);
  if (!setting?.enabled) throw Error('teams disabled');
  const [institution] = await tx
    .select()
    .from(institutions)
    .where(eq(institutions.id, setting.institutionId))
    .for('share')
    .limit(1);
  const [faculty] = await tx
    .select()
    .from(faculties)
    .where(eq(faculties.id, facultyId))
    .for('share')
    .limit(1);
  if (!institution?.active || !faculty?.active || faculty.universityId !== setting.universityId)
    throw Error('inactive');
  const existing = await tx
    .select({ marker: portalEntries.teamMarker })
    .from(portalEntries)
    .where(eq(portalEntries.teamCourseId, courseId));
  const proposals = await tx
    .select({ marker: academicTeamProposals.marker })
    .from(academicTeamProposals)
    .where(eq(academicTeamProposals.courseId, courseId));
  const used = [...existing, ...proposals]
    .filter((r) => /^[A-Z]+$/.test(r.marker))
    .map((r) => [...r.marker].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0));
  await tx
    .insert(teamCourseCounters)
    .values({ courseId, nextNumber: Math.max(0, ...used) })
    .onConflictDoNothing();
  const [counter] = await tx
    .select()
    .from(teamCourseCounters)
    .where(eq(teamCourseCounters.courseId, courseId))
    .for('update')
    .limit(1);
  const nextNumber = Math.max(counter.nextNumber, 0, ...used);
  const marker = teamLetter(nextNumber);
  await tx
    .update(teamCourseCounters)
    .set({ nextNumber: nextNumber + 1 })
    .where(eq(teamCourseCounters.courseId, courseId));
  return { ...setting, marker };
}
