import { db } from '@/db';
import { institutions, faculties, studentOrganizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Department } from './policy';
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function resolveScope(
  tx: Tx,
  input: {
    institutionId: string;
    facultyId?: string;
    organizationId?: string;
    department: Department;
  },
) {
  const [institution] = await tx
    .select()
    .from(institutions)
    .where(eq(institutions.id, input.institutionId))
    .limit(1);
  if (!institution || institution.deletedAt) throw new Error('institution not found');
  if (input.department === 'private_sector') {
    if (institution.kind !== 'private_sector' || input.facultyId || input.organizationId)
      throw new Error('invalid private scope');
    return {
      institution,
      organization: undefined,
      scope: {
        institutionId: institution.id,
        universityId: null,
        facultyId: null,
        organizationId: null,
        department: input.department,
      },
    };
  }
  if (institution.kind !== 'university' || !institution.universityId || !input.facultyId)
    throw new Error('invalid academic scope');
  const [faculty] = await tx
    .select()
    .from(faculties)
    .where(
      and(eq(faculties.id, input.facultyId), eq(faculties.universityId, institution.universityId)),
    )
    .limit(1);
  if (!faculty || !faculty.active) throw new Error('faculty not found');
  let organization: typeof studentOrganizations.$inferSelect | undefined;
  if (['student_union', 'student_activity'].includes(input.department)) {
    if (!input.organizationId) throw new Error('organization required');
    [organization] = await tx
      .select()
      .from(studentOrganizations)
      .where(
        and(
          eq(studentOrganizations.id, input.organizationId),
          eq(studentOrganizations.institutionId, institution.id),
          eq(studentOrganizations.facultyId, faculty.id),
          eq(studentOrganizations.kind, input.department as 'student_union' | 'student_activity'),
        ),
      )
      .limit(1);
    if (!organization) throw new Error('invalid organization scope');
  } else if (input.organizationId) throw new Error('unexpected organization');
  return {
    institution,
    organization,
    scope: {
      institutionId: institution.id,
      universityId: institution.universityId,
      facultyId: faculty.id,
      organizationId: organization?.id || null,
      department: input.department,
    },
  };
}
