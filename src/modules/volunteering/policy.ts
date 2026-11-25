import { z } from 'zod';
export const volunteerDivisionsInput = z
  .array(
    z.object({
      id: z.string().max(100).default(''),
      label: z.string().trim().min(2).max(100),
      description: z.string().trim().max(500).default(''),
      active: z.boolean().default(true),
    }),
  )
  .max(20)
  .superRefine((rows, ctx) => {
    if (new Set(rows.map((r) => r.label.toLocaleLowerCase())).size !== rows.length)
      ctx.addIssue({ code: 'custom', message: 'duplicate labels' });
    const ids = rows.map((r) => r.id).filter(Boolean);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', message: 'duplicate ids' });
  });
export const volunteerApplicationInput = z.object({
  entryId: z.string().min(1).max(100),
  divisionId: z.string().min(1).max(100),
  notes: z.string().trim().max(3000).default(''),
  applicationConsent: z.literal('on'),
});
export function volunteerApplicationsOpen(
  entry: { capacity: number | null; closesAt: Date | null },
  now = new Date(),
) {
  return entry.capacity !== 0 && (!entry.closesAt || entry.closesAt > now);
}

export function volunteerOrganizationInScope(
  member: { status: string; universityId: string; facultyId: string | null } | undefined,
  organization: { kind: string; universityId: string; facultyId: string },
) {
  return (
    !!member &&
    member.status === 'active' &&
    member.universityId === organization.universityId &&
    (organization.kind === 'student_activity' ||
      (organization.kind === 'student_union' &&
        !!member.facultyId &&
        member.facultyId === organization.facultyId))
  );
}
