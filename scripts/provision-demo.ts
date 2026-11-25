import { readDemoConfig } from './lib/demo-config';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
async function main() {
  const config = readDemoConfig(process.env);
  if (config.mode === 'disabled') {
    console.log('Demo account provisioning disabled.');
    return;
  }
  const { db } = await import('../src/db');
  const s = await import('../src/db/schema');
  const { eq, inArray } = await import('drizzle-orm');
  const { hashPassword, verifyPassword } = await import('better-auth/crypto');
  const logins = [
    { key: 'student', email: 'demo.student@studenthub.test', name: 'حساب الطالب' },
    { key: 'agent', email: 'demo.agent@studenthub.test', name: 'وكيل شؤون الطلاب' },
    { key: 'admin', email: 'demo.admin@studenthub.test', name: 'مسؤول المنصة' },
  ];
  const [v1] = await db
    .select()
    .from(s.demoProvisionRuns)
    .where(eq(s.demoProvisionRuns.id, 'demo-accounts-v1'))
    .limit(1);
  const [v2] = await db
    .select()
    .from(s.demoProvisionRuns)
    .where(eq(s.demoProvisionRuns.id, 'demo-accounts-v2'))
    .limit(1);
  const existing = await db
    .select({ id: s.user.id, email: s.user.email })
    .from(s.user)
    .where(
      inArray(
        s.user.email,
        logins.map((l) => l.email),
      ),
    );
  if (config.mode === 'status') {
    console.log(
      JSON.stringify({
        demoProvisionStatus: v2
          ? existing.length === 3
            ? 'separate_credentials_v2'
            : 'inconsistent'
          : v1
            ? existing.length === 3
              ? 'legacy_v1_requires_owner_approved_rotation'
              : 'inconsistent'
            : existing.length
              ? 'reserved_email_collision'
              : 'not_provisioned',
        reservedAccounts: existing.length,
        readOnly: true,
      }),
    );
    return;
  }
  // Passwords stay in environment/process memory and Better Auth credential rows, never logs or source.
  const hashed = await Promise.all(config.passwords.map((password) => hashPassword(password)));
  const result = await db.transaction(async (tx) => {
    const claim = await tx
      .insert(s.demoProvisionRuns)
      .values({ id: 'demo-accounts-v2' })
      .onConflictDoNothing()
      .returning({ id: s.demoProvisionRuns.id });
    if (!claim.length) return 'unchanged';
    const [legacy] = await tx
      .select()
      .from(s.demoProvisionRuns)
      .where(eq(s.demoProvisionRuns.id, 'demo-accounts-v1'))
      .limit(1);
    const people = await tx
      .select({ id: s.user.id, email: s.user.email })
      .from(s.user)
      .where(
        inArray(
          s.user.email,
          logins.map((l) => l.email),
        ),
      )
      .for('update');
    if (legacy) {
      if (!config.rotateLegacy || people.length !== 3)
        throw new Error('Legacy credentials require explicit owner-approved rotation.');
      const ids = logins.map((l) => people.find((p) => p.email === l.email)!.id);
      const credentials = await tx
        .select()
        .from(s.account)
        .where(inArray(s.account.userId, ids))
        .for('update');
      if (
        credentials.length !== 3 ||
        credentials.some(
          (c) => c.providerId !== 'credential' || c.accountId !== c.userId || !c.password,
        )
      )
        throw new Error('Unexpected account linkage.');
      const admins = await tx
        .select()
        .from(s.platformAdmins)
        .where(inArray(s.platformAdmins.userId, ids));
      const members = await tx
        .select()
        .from(s.memberships)
        .where(inArray(s.memberships.userId, ids));
      const agents = await tx
        .select()
        .from(s.institutionAgents)
        .where(inArray(s.institutionAgents.userId, ids));
      const [notice] = await tx
        .select()
        .from(s.institutionContent)
        .where(eq(s.institutionContent.id, 'demo-affairs-notice'))
        .limit(1);
      if (
        admins.length !== 1 ||
        admins[0].userId !== ids[2] ||
        members.length !== 2 ||
        !members.some(
          (m) => m.userId === ids[0] && m.role === 'student' && m.facultyId === 'demo-computing',
        ) ||
        !members.some(
          (m) => m.userId === ids[2] && m.role === 'admin' && m.facultyId === 'demo-computing',
        ) ||
        agents.length !== 1 ||
        agents[0].userId !== ids[1] ||
        agents[0].institutionId !== 'demo-institution' ||
        agents[0].facultyId !== 'demo-computing' ||
        notice?.authorId !== ids[1]
      )
        throw new Error('Legacy identity/role provenance does not match.');
      // Reject reuse of any existing demo password across the replacement set.
      for (const password of config.passwords)
        for (const c of credentials)
          if (await verifyPassword({ hash: c.password!, password }))
            throw new Error('Fresh credentials required.');
      for (let i = 0; i < ids.length; i++)
        await tx
          .update(s.account)
          .set({ password: hashed[i], updatedAt: new Date() })
          .where(eq(s.account.userId, ids[i]));
      await tx.delete(s.session).where(inArray(s.session.userId, ids));
      await tx.insert(s.institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: null,
        institutionId: 'demo-institution',
        action: 'demo.legacy-credentials-rotated-and-sessions-revoked',
        entityId: ids[2],
      });
      return 'rotated';
    }
    if (config.rotateLegacy || people.length)
      throw new Error(
        'Reserved email collision or unexpected rotation request. No existing account is elevated.',
      );
    const [institution] = await tx
      .select()
      .from(s.institutions)
      .where(eq(s.institutions.id, 'demo-institution'))
      .limit(1);
    const [faculty] = await tx
      .select()
      .from(s.faculties)
      .where(eq(s.faculties.id, 'demo-computing'))
      .limit(1);
    if (!institution || !faculty || institution.universityId !== faculty.universityId)
      throw new Error('Run migrations and demo seed before provisioning.');
    const users: Record<string, string> = {};
    for (let i = 0; i < logins.length; i++) {
      const login = logins[i];
      const id = crypto.randomUUID();
      users[login.key] = id;
      await tx
        .insert(s.user)
        .values({ id, name: login.name, email: login.email, emailVerified: false });
      await tx.insert(s.account).values({
        id: crypto.randomUUID(),
        userId: id,
        accountId: id,
        providerId: 'credential',
        password: hashed[i],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await tx.insert(s.memberships).values([
      {
        id: crypto.randomUUID(),
        userId: users.student,
        universityId: faculty.universityId,
        facultyId: faculty.id,
        faculty: faculty.name,
        role: 'student',
        status: 'active',
      },
      {
        id: crypto.randomUUID(),
        userId: users.admin,
        universityId: faculty.universityId,
        facultyId: faculty.id,
        faculty: faculty.name,
        role: 'admin',
        status: 'active',
      },
    ]);
    await tx.insert(s.platformAdmins).values({ userId: users.admin });
    const agentId = crypto.randomUUID();
    await tx.insert(s.institutionAgents).values({
      id: agentId,
      userId: users.agent,
      institutionId: institution.id,
      universityId: faculty.universityId,
      facultyId: faculty.id,
      department: 'student_affairs',
      isSuperAgent: true,
      position: 'representative',
      status: 'active',
      canRead: true,
      canEdit: true,
      canPublish: true,
    });
    const scopes: Omit<typeof s.institutionContent.$inferInsert, 'authorId'>[] = [
      {
        id: 'demo-affairs-notice',
        institutionId: institution.id,
        universityId: faculty.universityId,
        facultyId: faculty.id,
        organizationId: null,
        department: 'student_affairs',
        title: 'خطوتك الأولى مع شؤون الطلاب',
        body: 'تنظيم المستندات ومتابعة طلبات العضوية يساعدان على إتمام الإجراءات بوضوح. راجع بياناتك الأكاديمية قبل إرسال الطلب، وتابع حالته من حسابك. احتفظ بنسخة من أي مستند تقدمه عبر القنوات المعتمدة لدى جامعتك.',
      },
      {
        id: 'demo-welfare-notice',
        institutionId: institution.id,
        universityId: faculty.universityId,
        facultyId: faculty.id,
        organizationId: null,
        department: 'youth_welfare',
        title: 'مساحة رعاية الشباب والأنشطة',
        body: 'المشاركة في الأنشطة فرصة لاكتساب مهارات جديدة والعمل ضمن فريق. حدد اهتماماتك والوقت الذي تستطيع تخصيصه، وراجع تفاصيل النشاط مع الجهة المنظمة قبل المشاركة.',
      },
      {
        id: 'demo-union-notice',
        institutionId: institution.id,
        universityId: faculty.universityId,
        facultyId: faculty.id,
        organizationId: 'demo-union-computing',
        department: 'student_union',
        title: 'اتحاد الطلاب، صوتك في مجتمعك',
        body: 'يقوم العمل الطلابي على تمثيل احتياجات الزملاء ومناقشة المقترحات بوضوح. اكتب فكرتك والهدف منها والخطوات اللازمة لتنفيذها، ثم ناقشها مع مسؤولي المجتمع.',
      },
      {
        id: 'demo-activity-notice',
        institutionId: institution.id,
        universityId: faculty.universityId,
        facultyId: faculty.id,
        organizationId: 'demo-activity-computing',
        department: 'student_activity',
        title: 'نادي الابتكار الطلابي، نتعلم معًا',
        body: 'ابدأ بفكرة صغيرة قابلة للتنفيذ، وشكّل فريقًا يوزّع المسؤوليات بوضوح. حدد هدفًا وموعدًا للمراجعة، ووثّق ما تعلمه الفريق في كل مرحلة.',
      },
      {
        id: 'demo-private-notice',
        institutionId: 'demo-library',
        universityId: null,
        facultyId: null,
        organizationId: null,
        department: 'private_sector',
        title: 'المتجر الرئيسي، نموذج لخدمات الطلاب',
        body: 'اجمع مراجعك الدراسية في قائمة منظمة، وتحقق من المؤلف وتاريخ النشر ومصدر المادة. اربط كل مرجع بموضوعه لتسهيل العودة إليه أثناء المذاكرة.',
      },
    ];
    await tx.insert(s.institutionContent).values(
      scopes.map((item) => ({
        ...item,
        published: false,
        authorId: item.department === 'student_affairs' ? users.agent : users.admin,
      })),
    );
    await tx.insert(s.institutionAuditEvents).values({
      id: crypto.randomUUID(),
      actorId: null,
      institutionId: institution.id,
      action: 'demo.accounts-provisioned-by-operator',
      entityId: agentId,
    });
    return 'created';
  });
  console.log(
    result === 'created'
      ? 'Three demo accounts created atomically with separate credentials.'
      : result === 'rotated'
        ? 'Legacy demo credentials rotated atomically; all three demo sessions revoked.'
        : 'Demo accounts already provisioned with v2. No password or role changes made.',
  );
  console.log(
    'Student: demo.student@studenthub.test | Agent (student affairs): demo.agent@studenthub.test | Platform admin: demo.admin@studenthub.test',
  );
  console.log(
    'Remove all DEMO_PROVISION_* variables from Vercel after verification. Deleting env vars does not revoke accounts or sessions.',
  );
}
main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error(
      'Demo provisioning refused. Remove legacy shared-password variables; use status-only inspection and the v2 runbook. Check distinct credential configuration, owner-approved legacy rotation, or reserved-email collisions. No secrets logged.',
    );
    process.exit(1);
  });
