import type { db as Database } from '../../src/db';
import * as s from '../../src/db/schema';
import { eq, inArray } from 'drizzle-orm';
export async function seedVolunteerReviewFixtures(db: typeof Database) {
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
    throw new Error('Volunteer fixtures require disposable local database');
  const [owner] = await db
    .select({ id: s.user.id })
    .from(s.user)
    .where(eq(s.user.email, 'demo.admin@studenthub.test'))
    .limit(1);
  const [student] = await db
    .select({ id: s.user.id })
    .from(s.user)
    .where(eq(s.user.email, 'demo.student@studenthub.test'))
    .limit(1);
  if (!owner || !student) throw new Error('Missing local fixture accounts');
  const variants = ['a', 'b', 'empty', 'full', 'expired', 'hidden', 'draft', 'inactive'];
  const ids = variants.map((v) => 'volunteer-fixture-' + v);
  await db.delete(s.portalRequests).where(inArray(s.portalRequests.entryId, ids));
  await db.delete(s.portalSaved).where(inArray(s.portalSaved.entryId, ids));
  await db.delete(s.portalEntries).where(inArray(s.portalEntries.id, ids));
  await db
    .insert(s.institutions)
    .values({
      id: 'volunteer-fixture-inactive-provider',
      name: 'جهة اختبار محلية غير مفعلة',
      kind: 'private_sector',
      active: false,
    })
    .onConflictDoNothing();
  for (const [index, variant] of variants.entries()) {
    const hidden = variant === 'hidden';
    await db.insert(s.portalEntries).values({
      id: 'volunteer-fixture-' + variant,
      institutionId: hidden
        ? 'demo-institution'
        : variant === 'inactive'
          ? 'volunteer-fixture-inactive-provider'
          : 'demo-library',
      universityId: hidden ? 'demo-university' : null,
      facultyId: hidden ? 'test-other-faculty' : null,
      department: hidden ? 'youth_welfare' : 'private_sector',
      kind: 'volunteer',
      title: 'فرصة تطوع اختبار محلية ' + variant,
      description:
        'فرصة اصطناعية في قاعدة اختبار محلية فقط لفحص اختيار أقسام التطوع والطلبات الخاصة، ولا تمثل جهة أو عضوية فعلية.',
      category: 'اختبار محلي للتطوع',
      authorId: owner.id,
      published: variant !== 'draft',
      capacity: variant === 'full' ? 0 : 8,
      closesAt: variant === 'expired' ? new Date(Date.now() - 86400000) : null,
      createdAt: new Date(Date.now() - index * 1000),
    });
    if (variant !== 'empty')
      await db.insert(s.volunteerDivisions).values({
        id: 'volunteer-fixture-' + variant + '-division',
        entryId: 'volunteer-fixture-' + variant,
        label: variant === 'b' ? 'قسم التواصل المحلي' : 'قسم التنظيم المحلي',
        description: 'قسم اصطناعي للتحقق من طلبات التطوع في الاختبار المحلي فقط.',
        position: 0,
        active: true,
      });
  }
  await db.insert(s.volunteerDivisions).values([
    {
      id: 'volunteer-fixture-a-second',
      entryId: 'volunteer-fixture-a',
      label: 'قسم التقنية المحلي',
      description: 'مهام اختبارية في بيئة محلية، ليست تكليفًا حقيقيًا.',
      position: 1,
      active: true,
    },
    {
      id: 'volunteer-fixture-a-inactive',
      entryId: 'volunteer-fixture-a',
      label: 'قسم محلي غير متاح',
      description: 'قسم مخفي عن التقديم.',
      position: 2,
      active: false,
    },
  ]);
  await db.insert(s.portalRequests).values({
    id: 'volunteer-fixture-history',
    userId: student.id,
    entryId: 'volunteer-fixture-b',
    kind: 'volunteer',
    subject: 'طلب تطوع محلي سابق',
    body: 'طلب تطوع اصطناعي سابق للتحقق من بقاء اسم القسم التاريخي بعد تعديل الإعدادات.',
    status: 'completed',
    reference: 'SH-VOLUNTEER-LOCAL-HISTORY',
    createdAt: new Date(Date.now() - 86400000),
  });
  await db.insert(s.volunteerRequestChoices).values({
    requestId: 'volunteer-fixture-history',
    divisionId: 'volunteer-fixture-b-division',
    divisionLabel: 'قسم التواصل المحلي',
  });
}
