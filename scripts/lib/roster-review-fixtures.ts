import type { db as Database } from '../../src/db';
import * as s from '../../src/db/schema';
import { eq } from 'drizzle-orm';
export async function seedRosterReviewFixtures(db: typeof Database) {
  if (
    process.env.VERCEL ||
    (process.env.DATABASE_URL && !process.env.E2E_DATABASE_ALLOW_LOCAL_POSTGRES)
  )
    throw Error('Local fixture only');
  const [student] = await db
    .select()
    .from(s.user)
    .where(eq(s.user.email, 'demo.student@studenthub.test'));
  if (!student) throw Error('Missing local student');
  const [agent] = await db
    .select()
    .from(s.institutionAgents)
    .where(eq(s.institutionAgents.id, 'fixture-union'));
  for (const kind of ['team', 'volunteer', 'service'])
    await db
      .insert(s.portalEntries)
      .values({
        id: 'roster-fixture-' + kind,
        institutionId: 'demo-institution',
        universityId: 'demo-university',
        facultyId: 'demo-computing',
        organizationId: 'demo-union-computing',
        department: 'student_union',
        kind,
        title: kind === 'team' ? 'فريق سجل الطلاب' : 'فريق تنظيم الأنشطة',
        description: 'سجل محلي لاختبار عرض الأعضاء وملف البيانات',
        authorId: kind === 'service' ? agent.userId : student.id,
        published: true,
        teamCourseId: kind === 'team' ? 'team-fixture-course-a' : null,
      })
      .onConflictDoNothing();
  await db
    .insert(s.academicTeamMembers)
    .values({ entryId: 'roster-fixture-team', userId: student.id, role: 'leader' })
    .onConflictDoNothing();
  await db
    .insert(s.portalRequests)
    .values({
      id: 'roster-fixture-service-applicant',
      userId: student.id,
      entryId: 'roster-fixture-service',
      kind: 'service',
      subject: 'تقديم',
      body: 'طلب محلي',
      status: 'pending',
      reference: 'ROSTER-service',
    })
    .onConflictDoNothing();
  for (const status of ['accepted', 'pending', 'completed'])
    await db
      .insert(s.portalRequests)
      .values({
        id: 'roster-fixture-' + status,
        userId: student.id,
        entryId: 'roster-fixture-volunteer',
        kind: 'volunteer',
        subject: 'طلب تطوع',
        body: 'طلب محلي',
        status,
        reference: 'ROSTER-' + status,
      })
      .onConflictDoNothing();
}
