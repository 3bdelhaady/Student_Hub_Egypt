import type { db as Database } from '../../src/db';
import * as s from '../../src/db/schema';
import { randomBytes } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
export async function seedSectionReviewFixtures(
  db: typeof Database,
  credentials: Record<string, { email: string; password: string }>,
) {
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
    throw Error('Section fixtures require a disposable database');
  const rights = (edit: boolean, publish: boolean) => ({
    canRead: true,
    canEdit: edit,
    canPublish: publish,
  });
  for (const key of ['sectionwriter', 'sectionreader', 'sectionactivity']) {
    const id = 'section-fixture-user-' + key,
      email = key + '@example.test',
      password = randomBytes(24).toString('base64url');
    await db
      .insert(s.user)
      .values({ id, email, name: 'وكيل اختبار محلي ' + key })
      .onConflictDoNothing();
    await db
      .insert(s.account)
      .values({
        id: 'section-fixture-account-' + key,
        userId: id,
        accountId: id,
        providerId: 'credential',
        password: await hashPassword(password),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: s.account.id,
        set: { password: await hashPassword(password), updatedAt: new Date() },
      });
    const data = {
      userId: id,
      institutionId: 'demo-institution',
      universityId: 'demo-university',
      facultyId: 'demo-computing',
      organizationId:
        key === 'sectionactivity' ? 'demo-activity-computing' : 'demo-union-computing',
      department:
        key === 'sectionactivity' ? ('student_activity' as const) : ('student_union' as const),
      position: 'member' as const,
      status: 'active' as const,
      canRead: true,
      canEdit: key === 'sectionwriter',
      canPublish: key === 'sectionwriter',
      sectionPermissions: {
        ticket: rights(key === 'sectionwriter', false),
        academic: rights(key === 'sectionwriter', key === 'sectionwriter'),
      },
    };
    await db
      .insert(s.institutionAgents)
      .values({ id: 'section-fixture-agent-' + key, ...data })
      .onConflictDoUpdate({ target: s.institutionAgents.id, set: data });
    credentials[key] = { email, password };
  }
  await db
    .insert(s.studentOrganizations)
    .values({
      id: 'section-fixture-other-org',
      institutionId: 'demo-institution',
      universityId: 'demo-university',
      facultyId: 'test-other-faculty',
      kind: 'student_activity',
      name: 'نشاط اختبار كلية أخرى',
    })
    .onConflictDoNothing();
  for (const variant of ['own', 'foreign']) {
    const courseId = 'section-fixture-course-' + variant;
    await db
      .insert(s.courses)
      .values({
        id: courseId,
        universityId: 'demo-university',
        title: 'مقرر نطاق محلي ' + variant,
        description: 'مقرر اصطناعي في بيئة اختبار محلية للتحقق من عزل الصلاحيات.',
        category: 'علوم الحاسب',
        instructor: 'مسؤول اختبار محلي',
        published: true,
      })
      .onConflictDoUpdate({ target: s.courses.id, set: { published: true } });
    await db
      .insert(s.agentCourseScopes)
      .values({
        courseId,
        institutionId: 'demo-institution',
        universityId: 'demo-university',
        facultyId: variant === 'own' ? 'demo-computing' : 'test-other-faculty',
        organizationId: variant === 'own' ? 'demo-activity-computing' : 'section-fixture-other-org',
        department: 'student_activity',
      })
      .onConflictDoNothing();
    await db
      .insert(s.resources)
      .values({
        id: 'section-fixture-resource-' + variant,
        courseId,
        title: 'مورد اختبار نطاق ' + variant,
        kind: 'lecture',
        body: 'محتوى اصطناعي لاختبار نطاق المواد التعليمية فقط.',
        position: 0,
      })
      .onConflictDoNothing();
  }
  for (const kind of ['ticket', 'trip'] as const) {
    await db
      .insert(s.portalEntries)
      .values({
        id: 'section-fixture-' + kind,
        institutionId: 'demo-institution',
        universityId: 'demo-university',
        facultyId: 'demo-computing',
        organizationId: 'demo-union-computing',
        department: 'student_union',
        kind: kind === 'trip' ? 'training' : kind,
        archived: kind === 'trip',
        ticketType: kind === 'ticket' ? 'concert' : '',
        title: 'خدمة نطاق محلية ' + kind,
        description: 'خدمة اصطناعية لاختبار صلاحيات قسم منفصل في قاعدة اختبار.',
        authorId: 'section-fixture-user-sectionwriter',
        published: false,
      })
      .onConflictDoNothing();
  }
}
