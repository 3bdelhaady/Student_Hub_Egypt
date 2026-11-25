import { z } from 'zod';
export const teamCreationInput = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(6000),
  courseId: z.string().min(1).max(100),
});
export function canProposeTeam(
  membership: { status: string; universityId: string } | undefined,
  course: { universityId: string; published: boolean } | undefined,
) {
  return (
    !!membership &&
    membership.status === 'active' &&
    !!course?.published &&
    membership.universityId === course.universityId
  );
}
export function teamApplicationsOpen(
  entry: { capacity: number | null; closesAt: Date | null },
  now = new Date(),
) {
  return entry.capacity !== 0 && (!entry.closesAt || entry.closesAt > now);
}

export function teamLetter(number: number): string {
  if (!Number.isSafeInteger(number) || number < 0) throw Error('number');
  let result = '';
  for (let n = number + 1; n > 0; n = Math.floor((n - 1) / 26))
    result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
  return result;
}
