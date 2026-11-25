import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
async function main() {
  if (process.argv[2] !== '--confirm-hide-review-demo-v1')
    throw new Error('Explicit confirmation required');
  const { db } = await import('../src/db');
  const s = await import('../src/db/schema');
  const { eq } = await import('drizzle-orm');
  await db.transaction(async (tx) => {
    await tx
      .insert(s.demoProvisionRuns)
      .values({ id: 'review-demo-v1-disabled' })
      .onConflictDoNothing();
    for (const id of ['review-demo-store', 'review-demo-services']) {
      await tx
        .update(s.portalEntries)
        .set({ published: false, updatedAt: new Date() })
        .where(eq(s.portalEntries.institutionId, id));
      await tx
        .update(s.institutions)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(s.institutions.id, id));
    }
  });
  console.log(
    'Review demos hidden and reseeding disabled. Private request histories preserved. Suspend the dedicated test agent from admin separately.',
  );
  process.exit(0);
}
main().catch(() => {
  console.error('Review demo removal failed');
  process.exit(1);
});
