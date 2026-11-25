import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
async function main() {
  const email = process.argv[2];
  const universityId = process.argv[3];
  if (!email || !universityId)
    throw new Error(
      'Usage: npm run admin:grant -- email university-id. Stop the app first if using local PGlite.',
    );
  const { db } = await import('../src/db');
  const { user, memberships, auditEvents, universities } = await import('../src/db/schema');
  const { eq, and } = await import('drizzle-orm');
  const [person] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (!person) throw new Error('Create the account through signup first.');
  const [university] = await db
    .select()
    .from(universities)
    .where(eq(universities.id, universityId))
    .limit(1);
  if (!university) throw new Error('Unknown university.');
  await db.transaction(async (tx) => {
    const [member] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, person.id), eq(memberships.universityId, universityId)))
      .limit(1);
    if (member)
      await tx
        .update(memberships)
        .set({ role: 'admin', status: 'active' })
        .where(eq(memberships.id, member.id));
    else
      await tx.insert(memberships).values({
        id: crypto.randomUUID(),
        userId: person.id,
        universityId,
        role: 'admin',
        status: 'active',
      });
    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: null,
      universityId,
      action: 'admin.provisioned-by-operator',
      entityId: person.id,
    });
  });
  console.log('Administrator assigned for the specified account and university.');
  process.exit(0);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : 'Provisioning failed');
  process.exit(1);
});
