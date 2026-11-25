import type { db as Database } from '../../src/db';
import * as s from '../../src/db/schema';
import { eq, inArray } from 'drizzle-orm';
export async function seedTeamReviewFixtures(db: typeof Database) {
  const url = process.env.DATABASE_URL;
  if (
    process.env.DEMO_MODE !== 'true' ||
    (url &&
      !(
        process.env.E2E_DATABASE_ALLOW_LOCAL_POSTGRES === 'true' &&
        new URL(url).hostname === '127.0.0.1' &&
        new URL(url).pathname === '/studenthub_e2e'
      ))
  )
    throw new Error('Team fixtures require disposable local database');
  const [owner] = await db
    .select({ id: s.user.id })
    .from(s.user)
    .where(eq(s.user.email, 'demo.admin@studenthub.test'))
    .limit(1);
  if (!owner) throw new Error('Missing fixture owner');
  const variants = [
    'open-a',
    'open-b',
    'closed',
    'second',
    'hidden',
    'draft',
    'unavailable-course',
    'unassigned',
  ];
  const ids = variants.map((n) => 'team-fixture-' + n);
  const courseIds = ['team-fixture-course-a', 'team-fixture-course-b', 'team-fixture-course-draft'];
  const proposalRows = await db
    .select({ id: s.academicTeamProposals.requestId })
    .from(s.academicTeamProposals)
    .where(inArray(s.academicTeamProposals.courseId, courseIds));
  await db.delete(s.portalRequests).where(inArray(s.portalRequests.entryId, ids));
  if (proposalRows.length)
    await db.delete(s.portalRequests).where(
      inArray(
        s.portalRequests.id,
        proposalRows.map((r) => r.id),
      ),
    );
  await db.delete(s.portalSaved).where(inArray(s.portalSaved.entryId, ids));
  await db.delete(s.portalEntries).where(inArray(s.portalEntries.id, ids));
  for (const [index, id] of courseIds.entries())
    await db
      .insert(s.courses)
      .values({
        id,
        universityId: 'demo-university',
        title: ['مقرر اختبار الفرق الأول', 'مقرر اختبار الفرق الثاني', 'مقرر اختبار فرق غير منشور'][
          index
        ],
        description: 'مقرر اصطناعي في قاعدة اختبار محلية فقط، لا يمثل محتوى أو تسجيلًا حقيقيًا.',
        category: 'اختبار محلي للفرق',
        instructor: 'فريق الاختبار المحلي',
        published: index !== 2,
      })
      .onConflictDoUpdate({ target: s.courses.id, set: { published: index !== 2 } });
  await db
    .insert(s.teamCourseSettings)
    .values(
      courseIds.slice(0, 2).map((courseId) => ({
        courseId,
        facultyId: 'demo-computing',
        institutionId: 'demo-institution',
        universityId: 'demo-university',
        enabled: true,
        maxMembers: 5,
        conditions: 'حد أقصى خمسة أعضاء',
        updatedBy: owner.id,
      })),
    )
    .onConflictDoNothing();
  for (const [index, variant] of variants.entries()) {
    const unassigned = variant === 'unassigned';
    await db.insert(s.portalEntries).values({
      id: 'team-fixture-' + variant,
      institutionId: unassigned ? 'demo-library' : 'demo-institution',
      universityId: unassigned ? null : 'demo-university',
      facultyId: unassigned ? null : variant === 'hidden' ? 'test-other-faculty' : 'demo-computing',
      department: unassigned ? 'private_sector' : 'youth_welfare',
      kind: 'team',
      title: 'فريق اختبار محلي ' + variant,
      description:
        'مشروع فريق اصطناعي في قاعدة اختبار محلية فقط لفحص طلبات الانضمام وحماية نطاق المقرر، دون عضوية أو جهات حقيقية.',
      category: 'اختبار محلي للفرق',
      authorId: owner.id,
      published: variant !== 'draft',
      teamCourseId: unassigned
        ? null
        : variant === 'unavailable-course'
          ? courseIds[2]
          : variant === 'second'
            ? courseIds[1]
            : courseIds[0],
      teamMarker: unassigned ? '' : String.fromCharCode(65 + index),
      capacity: variant === 'closed' ? 0 : 5,
      createdAt: new Date(Date.now() - index * 1000),
    });
  }
}
