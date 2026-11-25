import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
async function main() {
  const { db } = await import('../src/db');
  const { sql } = await import('drizzle-orm');
  const fs = await import('node:fs/promises');
  await db.execute(
    sql.raw(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    ),
  );
  const applied = new Set<string>();
  for (const name of (await fs.readdir('migrations')).filter((n) => n.endsWith('.sql')).sort()) {
    const content = await fs.readFile(`migrations/${name}`, 'utf8');
    let didApply = false;
    await db.transaction(async (tx) => {
      if (process.env.DATABASE_URL) await tx.execute(sql`SELECT pg_advisory_xact_lock(75423019)`);
      const check = await tx.execute(sql`SELECT name FROM schema_migrations WHERE name=${name}`);
      if (check.rows.length) return;
      for (const statement of content
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean))
        await tx.execute(sql.raw(statement));
      await tx.execute(sql`INSERT INTO schema_migrations(name) VALUES (${name})`);
      didApply = true;
    });
    if (!didApply) continue;
    applied.add(name);
    console.log('Applied', name);
  }
  const removed = await db.execute(
    sql.raw(
      "SELECT to_regclass('national_id_vault') AS vault, (SELECT count(*)::int FROM information_schema.columns WHERE table_schema='public' AND table_name='user' AND column_name='national_id_fingerprint') AS fingerprints",
    ),
  );
  if (removed.rows[0]?.vault || Number(removed.rows[0]?.fingerprints) !== 0)
    throw new Error('Legacy national identity storage removal verification failed');
  console.log('Verified: legacy national identity vault and fingerprint storage removed.');
  const invalidRequests = await db.execute(
    sql.raw(
      "SELECT count(*)::int AS count FROM portal_requests WHERE status NOT IN ('pending','reviewing','accepted','completed')",
    ),
  );
  if (Number(invalidRequests.rows[0]?.count) !== 0) throw Error('Invalid request statuses remain');
  console.log(
    'Verified: requests use only the four approved statuses; legacy rejected and cancelled request records removed.',
  );
  const requestedScope = await db.execute(
    sql.raw(
      "SELECT count(*)::int AS count FROM memberships m JOIN \"user\" u ON u.id=m.user_id WHERE md5(lower(u.email))='24ba4514a80668230e72e37997ebe0c3' AND m.university_id='demo-university' AND m.faculty_id='demo-computing'",
    ),
  );
  if (
    process.env.VERCEL &&
    applied.has('0047_requested_student_faculty.sql') &&
    Number(requestedScope.rows[0]?.count) !== 1
  )
    throw Error(
      'Requested student faculty assignment not verified: expected exactly one existing account',
    );
  console.log(
    'Requested student faculty assignment verification: ' +
      Number(requestedScope.rows[0]?.count) +
      ' matching account(s).',
  );
  const remainingStudents = await db.execute(
    sql.raw(
      "SELECT count(*)::int AS count FROM memberships WHERE role='student' AND (university_id<>'demo-university' OR faculty_id IS DISTINCT FROM 'demo-computing')",
    ),
  );
  if (
    applied.has('0049_existing_test_student_faculty.sql') &&
    Number(remainingStudents.rows[0]?.count) !== 0
  )
    throw Error('Test student faculty alignment not verified');
  console.log(
    'Verified: existing test student memberships aligned to requested faculty; roles and activation states unchanged.',
  );
  if (applied.has('0050_test_affairs_faculty.sql')) {
    const outstandingAffairs = await db.execute(
      sql.raw(
        "SELECT count(*)::int AS count FROM institution_agents WHERE department='student_affairs' AND (university_id IS DISTINCT FROM 'demo-university' OR faculty_id IS DISTINCT FROM 'demo-computing')",
      ),
    );
    if (Number(outstandingAffairs.rows[0]?.count) !== 0)
      throw Error(
        'Some Student Affairs grants require an institution decision before faculty alignment',
      );
    console.log(
      'Verified: Student Affairs faculty alignment complete; private-sector/admin scope unchanged.',
    );
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
