import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
async function main() {
  const id = process.argv[2];
  if (!id) throw new Error('Usage: npm run integration:revoke -- integration-id');
  const { db } = await import('../src/db');
  const { integrationTokens, auditEvents } = await import('../src/db/schema');
  const { eq } = await import('drizzle-orm');
  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(integrationTokens)
      .set({ revokedAt: new Date() })
      .where(eq(integrationTokens.id, id))
      .returning();
    if (!row) throw new Error('Integration not found');
    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: null,
      universityId: row.universityId,
      action: 'integration.revoked-by-operator',
      entityId: id,
    });
  });
  console.log('Integration revoked.');
  process.exit(0);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : 'Failed');
  process.exit(1);
});
