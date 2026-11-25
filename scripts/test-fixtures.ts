import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { randomBytes, createHash } from 'node:crypto';
import fs from 'node:fs/promises';
async function main() {
  const url = process.env.DATABASE_URL;
  const disposableNetworkDb =
    url &&
    process.env.E2E_DATABASE_ALLOW_LOCAL_POSTGRES === 'true' &&
    new URL(url).hostname === '127.0.0.1' &&
    new URL(url).pathname === '/studenthub_e2e';
  if (process.env.DEMO_MODE !== 'true' || (url && !disposableNetworkDb)) {
    throw new Error('Fixtures require a disposable local demo database.');
  }
  const { spawnSync } = await import('node:child_process');
  const demoPasswords = Object.fromEntries(
    ['student', 'agent', 'admin'].map((role) => [role, randomBytes(32).toString('base64url')]),
  );
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/provision-demo.ts'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        DEMO_PROVISION_V2_ENABLED: 'true',
        DEMO_PROVISION_ALLOW_LOCAL: 'true',
        DEMO_PROVISION_STUDENT_PASSWORD: demoPasswords.student,
        DEMO_PROVISION_AGENT_PASSWORD: demoPasswords.agent,
        DEMO_PROVISION_ADMIN_PASSWORD: demoPasswords.admin,
      },
    });
    if (result.status !== 0) throw new Error('Test demo provisioning failed');
    if (attempt === 0 && !result.stdout.includes('created atomically'))
      throw new Error('Fixtures require fresh database for provisioning');
    if (attempt === 1 && !result.stdout.includes('already provisioned'))
      throw new Error('Provisioning was not idempotent');
  }
  const { hashPassword } = await import('better-auth/crypto');
  const { auth } = await import('../src/lib/auth');
  const { db } = await import('../src/db');
  const s = await import('../src/db/schema');
  await db
    .insert(s.universities)
    .values({ id: 'other-university', name: 'مجتمع اختبار مستقل', city: 'بيئة اختبار' })
    .onConflictDoNothing();
  const credentials: Record<string, { email: string; password: string }> = {};
  for (const [role, status, university] of [
    ['admin', 'active', 'demo-university'],
    ['student', 'active', 'demo-university'],
    ['pending', 'pending', 'demo-university'],
    ['locked', 'pending', 'demo-university'],
    ['outsider', 'active', 'other-university'],
    ['editor', 'active', 'demo-university'],
    ['csvstudent', 'pending', 'demo-university'],
    ['apistudent', 'pending', 'demo-university'],
    ['rosteroutsider', 'pending', 'other-university'],
  ]) {
    const password = randomBytes(24).toString('base64url');
    const email = `${role}-${Date.now()}@example.test`;
    const result = await auth.api.signUpEmail({
      body: {
        name: role === 'admin' ? 'مسؤول الاختبار' : 'طالب الاختبار',
        email,
        password,
        signupGender: 'male',
      } as never,
    });
    await db.insert(s.memberships).values({
      id: crypto.randomUUID(),
      userId: result.user.id,
      universityId: university,
      role: role === 'admin' ? 'admin' : role === 'editor' ? 'editor' : 'student',
      status: status as 'active' | 'pending',
      faculty: 'كلية تجريبية',
      facultyId: university === 'demo-university' ? 'demo-computing' : null,
    });
    if (role === 'admin') await db.insert(s.platformAdmins).values({ userId: result.user.id });
    credentials[role] = { email, password };
  }
  await db
    .insert(s.courses)
    .values([
      {
        id: 'draft-course',
        universityId: 'demo-university',
        title: 'مسودة لا تعرض للعامة',
        description: 'مقرر مخفي مخصص للتحقق من حماية المسودات.',
        category: 'اختبار',
        instructor: 'فريق الاختبار',
        published: false,
      },
      {
        id: 'other-course',
        universityId: 'other-university',
        title: 'مقرر مجتمع آخر',
        description: 'مقرر لا يظهر في إدارة مجتمعك.',
        category: 'اختبار',
        instructor: 'فريق الاختبار',
        published: true,
      },
    ])
    .onConflictDoNothing();
  await db
    .insert(s.resources)
    .values({
      id: 'other-secret',
      courseId: 'other-course',
      title: 'مورد خاص بالمجتمع الآخر',
      kind: 'lecture',
      body: 'OTHER_SCOPE_SECRET_RESOURCE_BODY',
      position: 1,
    })
    .onConflictDoNothing();
  for (const key of ['student', 'agent', 'admin'])
    credentials['demo' + key] = {
      email: `demo.${key}@studenthub.test`,
      password: demoPasswords[key],
    };
  await db
    .insert(s.faculties)
    .values({ id: 'test-other-faculty', universityId: 'demo-university', name: 'كلية اختبار أخرى' })
    .onConflictDoNothing();
  await db
    .insert(s.studentOrganizations)
    .values([
      {
        id: 'fixture-other-union',
        institutionId: 'demo-institution',
        universityId: 'demo-university',
        facultyId: 'test-other-faculty',
        kind: 'student_union',
        name: 'اتحاد كلية أخرى',
      },
      {
        id: 'fixture-other-activity',
        institutionId: 'demo-institution',
        universityId: 'demo-university',
        facultyId: 'test-other-faculty',
        kind: 'student_activity',
        name: 'نشاط عبر كليات الجامعة',
      },
    ])
    .onConflictDoNothing();
  for (const [key, department, facultyId, organizationId, position, status] of [
    ['welfare', 'youth_welfare', 'demo-computing', null, 'representative', 'active'],
    ['union', 'student_union', 'demo-computing', 'demo-union-computing', 'president', 'active'],
    ['otheraffairs', 'student_affairs', 'test-other-faculty', null, 'representative', 'active'],
    ['pendingagent', 'student_affairs', 'demo-computing', null, 'representative', 'pending'],
    ['readagent', 'youth_welfare', 'demo-computing', null, 'representative', 'active'],
  ]) {
    const id = crypto.randomUUID();
    const password = randomBytes(24).toString('base64url');
    const email = `${key}-${Date.now()}@example.test`;
    await db.insert(s.user).values({ id, email, name: `وكيل اختبار ${key}` });
    await db.insert(s.account).values({
      id: crypto.randomUUID(),
      userId: id,
      accountId: id,
      providerId: 'credential',
      password: await hashPassword(password),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(s.institutionAgents).values({
      id: `fixture-${key}`,
      userId: id,
      institutionId: 'demo-institution',
      universityId: 'demo-university',
      facultyId,
      organizationId,
      department: department as 'youth_welfare',
      position: position as 'representative',
      status: status as 'active',
      isSuperAgent: key === 'otheraffairs',
      canRead: true,
      canEdit: key !== 'readagent',
      canPublish: key !== 'readagent',
    });
    if (key === 'union')
      await db.insert(s.memberships).values({
        id: crypto.randomUUID(),
        userId: id,
        universityId: 'demo-university',
        facultyId: 'demo-computing',
        faculty: 'كلية الحاسبات والمعلومات',
        role: 'student',
        status: 'active',
      });
    credentials[key!] = { email, password };
  }

  await db.update(s.institutionContent).set({ published: true });
  const integrationToken = 'sh_' + randomBytes(32).toString('base64url');
  await db.insert(s.integrationTokens).values({
    id: crypto.randomUUID(),
    universityId: 'demo-university',
    digest: createHash('sha256').update(integrationToken).digest('hex'),
    expiresAt: new Date(Date.now() + 3600000),
  });
  const { seedPollReviewFixtures } = await import('./lib/poll-review-fixtures');
  await seedPollReviewFixtures(db, [
    credentials.demostudent.email,
    credentials.student.email,
    credentials.outsider.email,
  ]);
  const { seedTeamReviewFixtures } = await import('./lib/team-review-fixtures');
  await seedTeamReviewFixtures(db);
  const { seedVolunteerReviewFixtures } = await import('./lib/volunteer-review-fixtures');
  await seedVolunteerReviewFixtures(db);
  const { seedSectionReviewFixtures } = await import('./lib/section-review-fixtures');
  await seedSectionReviewFixtures(db, credentials);
  const { seedReviewDemos } = await import('./lib/review-demos');
  await seedReviewDemos(db);
  const { seedStoreReviewAgent } = await import('./lib/store-review-agent');
  await seedStoreReviewAgent(db, credentials);
  const { seedPresentationCatalog } = await import('./lib/presentation-catalog');
  await seedPresentationCatalog(db);
  const { seedPresentationServices } = await import('./lib/presentation-services');
  await seedPresentationServices(db);
  const { ensureDefaultUnions } = await import('../src/modules/institution/default-unions');
  await db.transaction(ensureDefaultUnions);
  await fs.writeFile('.data/integration-test-token', integrationToken, { mode: 0o600 });
  await fs.writeFile('.data/e2e.json', JSON.stringify(credentials), { mode: 0o600 });
  await db
    .insert(s.institutions)
    .values(
      Array.from({ length: 105 }, (_, n) => ({
        id: 'search-proof-' + n,
        name: n === 0 ? 'اختبار بحث عميق أقدم' : 'بحث تجريبي ' + n,
        kind: 'private_sector' as const,
        active: false,
        createdAt: new Date(2000, 0, n + 1),
      })),
    )
    .onConflictDoNothing();
  console.log('Isolated test accounts prepared; credentials were not printed.');
  const { seedRosterReviewFixtures } = await import('./lib/roster-review-fixtures');
  await seedRosterReviewFixtures(db);
  process.exit(0);
}
main().catch((e) => {
  console.error('Fixture setup failed', e instanceof Error ? e.message : '');
  process.exit(1);
});
