import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { randomBytes, createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
async function main() {
  const universityId = process.argv[2];
  const output = process.argv[3];
  if (!universityId || !output || !path.isAbsolute(output))
    throw new Error(
      'Usage: npm run integration:create -- university-id /absolute/private/token-file',
    );
  const { db } = await import('../src/db');
  const { integrationTokens, auditEvents } = await import('../src/db/schema');
  const token = 'sh_' + randomBytes(32).toString('base64url');
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await fs.writeFile(output, token, { mode: 0o600, flag: 'wx' });
  try {
    await db.transaction(async (tx) => {
      await tx.insert(integrationTokens).values({
        id,
        universityId,
        digest: createHash('sha256').update(token).digest('hex'),
        expiresAt,
      });
      await tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: null,
        universityId,
        action: 'integration.issued-by-operator',
        entityId: id,
      });
    });
  } catch (e) {
    await fs.unlink(output);
    throw e;
  }
  console.log(
    'Integration created:',
    id,
    'expires:',
    expiresAt.toISOString(),
    '; token saved to specified private file, not printed.',
  );
  process.exit(0);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : 'Failed');
  process.exit(1);
});
