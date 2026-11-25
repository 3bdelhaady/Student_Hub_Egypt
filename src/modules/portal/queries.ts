import { commerceKinds } from './policy';
import { governorateMatches } from '../institution/governorates';
import { courseInStudentScope, studentCourseScopeSql } from '@/modules/agent-academic/queries';
import { db } from '@/db';
import {
  portalEntries,
  courses,
  institutions,
  faculties,
  studentOrganizations,
  institutionAgents,
  universities,
} from '@/db/schema';
import { eq, and, or, isNull, desc, ne, sql, inArray } from 'drizzle-orm';
import { viewer } from '@/lib/session';
import { canEditPortal, canReadPortal } from './management-policy';
import type { EntryKind } from './policy';
import type { Tx } from '../institution/service';

export async function studentInstitutionScope(
  institutionId: string,
  membership: { status: string; universityId: string } | undefined,
  tx: Tx | typeof db = db,
) {
  const [institution] = await tx
    .select()
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1);
  if (!institution?.active) return false;
  if (institution.kind !== 'private_sector' || institution.category !== 'restaurant') return true;
  if (membership?.status !== 'active') return false;
  const [university] = await tx
    .select()
    .from(universities)
    .where(eq(universities.id, membership.universityId))
    .limit(1);
  return governorateMatches(institution.governorate, university?.governorate);
}
export function studentInstitutionScopeSql(
  membership: { status: string; universityId: string } | undefined,
) {
  return or(
    ne(institutions.kind, 'private_sector'),
    ne(institutions.category, 'restaurant'),
    membership?.status === 'active'
      ? and(
          ne(institutions.governorate, ''),
          sql`${institutions.governorate} = (select governorate from universities where id = ${membership.universityId})`,
        )
      : undefined,
  );
}

export type PortalEntry = typeof portalEntries.$inferSelect;
export async function activeEntryScope(
  entry: Pick<PortalEntry, 'institutionId' | 'facultyId' | 'organizationId'>,
  tx: Tx | typeof db = db,
) {
  const [i] = await tx
    .select()
    .from(institutions)
    .where(eq(institutions.id, entry.institutionId))
    .limit(1);
  const [f] = entry.facultyId
    ? await tx.select().from(faculties).where(eq(faculties.id, entry.facultyId)).limit(1)
    : [];
  const [o] = entry.organizationId
    ? await tx
        .select()
        .from(studentOrganizations)
        .where(eq(studentOrganizations.id, entry.organizationId))
        .limit(1)
    : [];
  return !!i?.active && (!entry.facultyId || !!f?.active) && (!entry.organizationId || !!o?.active);
}
// Student availability includes a linked course; management scope deliberately does not.
export async function activeStudentEntryScope(
  entry: Pick<
    PortalEntry,
    | 'institutionId'
    | 'facultyId'
    | 'organizationId'
    | 'teamCourseId'
    | 'universityId'
    | 'kind'
    | 'targetUniversityId'
    | 'targetFacultyId'
    | 'targetGovernorate'
  >,
  membership: Parameters<typeof studentCourseScopeSql>[0],
  tx: Tx | typeof db = db,
) {
  if (
    !(await activeEntryScope(entry, tx)) ||
    !(await studentInstitutionScope(entry.institutionId, membership, tx))
  )
    return false;
  if (
    !commerceKinds.includes(entry.kind) &&
    (entry.targetUniversityId || entry.targetFacultyId || entry.targetGovernorate)
  ) {
    if (
      membership?.status !== 'active' ||
      (entry.targetUniversityId && entry.targetUniversityId !== membership.universityId) ||
      (entry.targetFacultyId && entry.targetFacultyId !== membership.facultyId)
    )
      return false;
    if (entry.targetGovernorate) {
      const [u] = await tx
        .select()
        .from(universities)
        .where(eq(universities.id, membership.universityId))
        .limit(1);
      if (u?.governorate !== entry.targetGovernorate) return false;
    }
  }
  if (!entry.teamCourseId) return true;
  const [course] = await tx
    .select()
    .from(courses)
    .where(eq(courses.id, entry.teamCourseId))
    .limit(1);
  return (
    entry.kind === 'team' &&
    !!course?.published &&
    course.universityId === entry.universityId &&
    (await courseInStudentScope(course.id, membership, tx))
  );
}
export async function canManagePortalEntry(
  v: NonNullable<Awaited<ReturnType<typeof viewer>>>,
  entry: PortalEntry,
  tx: Tx | typeof db = db,
) {
  if (v.platformAdmin) return true;
  const [a] = await tx
    .select()
    .from(institutionAgents)
    .where(eq(institutionAgents.userId, v.user.id))
    .limit(1);
  return canEditPortal(a, entry, await activeEntryScope(entry, tx));
}
export async function canReadPortalEntry(
  v: NonNullable<Awaited<ReturnType<typeof viewer>>>,
  entry: PortalEntry,
) {
  if (v.platformAdmin) return true;
  const [a] = await db
    .select()
    .from(institutionAgents)
    .where(eq(institutionAgents.userId, v.user.id))
    .limit(1);
  return canReadPortal(a, entry, await activeEntryScope(entry));
}
export async function visiblePortalEntries(kind?: EntryKind) {
  const v = await viewer();
  const m = v?.membership;
  const rows = await db
    .select({ entry: portalEntries })
    .from(portalEntries)
    .innerJoin(institutions, eq(institutions.id, portalEntries.institutionId))
    .leftJoin(courses, eq(courses.id, portalEntries.teamCourseId))
    .leftJoin(faculties, eq(faculties.id, portalEntries.facultyId))
    .leftJoin(studentOrganizations, eq(studentOrganizations.id, portalEntries.organizationId))
    .where(
      and(
        kind ? eq(portalEntries.kind, kind) : undefined,
        studentCourseScopeSql(m),
        or(
          inArray(portalEntries.kind, commerceKinds),
          isNull(portalEntries.targetUniversityId),
          m?.status === 'active' ? eq(portalEntries.targetUniversityId, m.universityId) : undefined,
        ),
        or(
          inArray(portalEntries.kind, commerceKinds),
          isNull(portalEntries.targetFacultyId),
          m?.status === 'active' && m.facultyId
            ? eq(portalEntries.targetFacultyId, m.facultyId)
            : undefined,
        ),
        or(
          inArray(portalEntries.kind, commerceKinds),
          eq(portalEntries.targetGovernorate, ''),
          m?.status === 'active'
            ? sql`${portalEntries.targetGovernorate} = (select governorate from universities where id=${m.universityId})`
            : undefined,
        ),
        eq(portalEntries.published, true),
        eq(portalEntries.archived, false),
        process.env.VERCEL
          ? and(
              eq(portalEntries.demo, false),
              sql`${portalEntries.title} !~ '^(ديمو[:：]|بيانات (تجريبية|وهمية))'`,
              sql`${portalEntries.description} !~ '^بيانات (تجريبية|وهمية)'`,
            )
          : undefined,
        or(
          isNull(portalEntries.teamCourseId),
          and(
            eq(portalEntries.kind, 'team'),
            eq(courses.published, true),
            eq(courses.universityId, portalEntries.universityId),
          ),
        ),
        eq(institutions.active, true),
        studentInstitutionScopeSql(m),
        or(isNull(portalEntries.facultyId), eq(faculties.active, true)),
        or(isNull(portalEntries.organizationId), eq(studentOrganizations.active, true)),
        or(
          and(eq(portalEntries.department, 'private_sector'), isNull(portalEntries.universityId)),
          m?.status === 'active'
            ? and(
                eq(portalEntries.universityId, m.universityId),
                or(
                  isNull(portalEntries.facultyId),
                  and(eq(portalEntries.kind, 'poll'), eq(portalEntries.pollAudience, 'university')),
                  and(
                    eq(portalEntries.kind, 'volunteer'),
                    eq(portalEntries.department, 'student_activity'),
                  ),
                  m.facultyId
                    ? eq(portalEntries.facultyId, m.facultyId)
                    : isNull(portalEntries.facultyId),
                ),
              )
            : undefined,
        ),
      ),
    )
    .orderBy(desc(portalEntries.createdAt))
    .limit(500);
  return rows.map((r) => r.entry);
}
