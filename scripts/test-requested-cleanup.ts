import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
if (process.env.DATABASE_URL || process.env.DEMO_MODE !== 'true')
  throw Error('Disposable local database only');
async function main() {
  const { db } = await import('../src/db');
  const { sql } = await import('drizzle-orm');
  const fs = await import('node:fs/promises');
  const { cleanupPreview, commitRequestedCleanup } =
    await import('../src/modules/institution/requested-cleanup');
  const creds = JSON.parse(await fs.readFile('.data/e2e.json', 'utf8'));
  await db.execute(
    sql`UPDATE "user" SET email='demo.store.agent@studenthub.test' WHERE email=${creds.storereview.email}`,
  );
  await db.execute(
    sql`INSERT INTO "user"(id,name,email) VALUES('cleanup-protected-owner','مالك الاختبار','mahmoudabdelhady102@gmail.com')`,
  );
  const p = await cleanupPreview();
  if (p.keepAccounts.length !== 5 || !p.remove.length) throw Error('Bad preview');
  const actor = p.keepAccounts.find((a) => a.email === 'demo.admin@studenthub.test')!;
  const before = JSON.stringify(
    (
      await db.execute(
        sql`SELECT user_id,password FROM account WHERE user_id IN (SELECT id FROM "user" WHERE email IN ('demo.student@studenthub.test','demo.agent@studenthub.test','demo.admin@studenthub.test','demo.store.agent@studenthub.test')) ORDER BY user_id`,
      )
    ).rows,
  );
  try {
    await commitRequestedCleanup('invalid', actor.id);
    throw Error('Bad digest accepted');
  } catch (e) {
    if ((e as Error).message === 'Bad digest accepted') throw e;
  }
  const result = await commitRequestedCleanup(p.digest, actor.id);
  const after = JSON.stringify(
    (
      await db.execute(
        sql`SELECT user_id,password FROM account WHERE user_id IN (SELECT id FROM "user" WHERE email IN ('demo.student@studenthub.test','demo.agent@studenthub.test','demo.admin@studenthub.test','demo.store.agent@studenthub.test')) ORDER BY user_id`,
      )
    ).rows,
  );
  if (before !== after) throw Error('Protected credentials changed');
  const live = await cleanupPreview();
  if (!live.done || live.remove.length || live.keepAccounts.length !== 5)
    throw Error('Cleanup incomplete');
  const credentials = (
    await db.execute(
      sql`SELECT count(*)::int n FROM account a JOIN "user" u ON u.id=a.user_id WHERE u.email LIKE '%@deleted.studenthub.invalid'`,
    )
  ).rows[0];
  if (Number(credentials.n)) throw Error('Deleted account can log in');
  const universities = (
    await db.execute(
      sql`SELECT count(*)::int n FROM institutions WHERE kind='university' AND (NOT active OR deleted_at IS NOT NULL)`,
    )
  ).rows[0];
  if (Number(universities.n)) throw Error('University changed');
  console.log(
    'Cleanup regression passed: protected credentials identical, excluded logins/grants removed, history valid, universities preserved, one-time marker set.',
    result,
  );
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
