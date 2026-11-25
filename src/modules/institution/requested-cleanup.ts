import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
export const cleanupId = 'owner-requested-account-cleanup-20261125';
const keep = [
  'demo.student@studenthub.test',
  'demo.agent@studenthub.test',
  'demo.admin@studenthub.test',
  'demo.store.agent@studenthub.test',
  'mahmoudabdelhady102@gmail.com',
];
export async function cleanupPreview(tx: Pick<typeof db, 'execute'> = db) {
  const accounts = (
    await tx.execute(
      sql`SELECT id,email,name FROM "user" WHERE email NOT LIKE '%@deleted.studenthub.invalid' ORDER BY email`,
    )
  ).rows as { id: string; email: string; name: string }[];
  const institutions = (
    await tx.execute(sql`SELECT i.id,i.name,i.kind,
    (SELECT count(*)::int FROM institution_agents a JOIN "user" u ON u.id=a.user_id WHERE a.institution_id=i.id AND lower(u.email) IN (${sql.join(
      keep.map((e) => sql`${e}`),
      sql`, `,
    )})) AS kept_agents,
    ((SELECT count(*)::int FROM portal_entries e WHERE e.institution_id=i.id AND NOT e.archived AND e.published AND NOT e.demo AND e.title NOT LIKE 'ديمو:%') +
    (SELECT count(*)::int FROM institution_content c WHERE c.institution_id=i.id AND c.published) +
    (SELECT count(*)::int FROM certificate_records c WHERE c.institution_id=i.id AND c.published AND NOT c.deleted) +
    (SELECT count(*)::int FROM agent_course_scopes c WHERE c.institution_id=i.id) +
    (SELECT count(*)::int FROM social_posts c WHERE c.institution_id=i.id)) AS useful_records
    FROM institutions i WHERE i.deleted_at IS NULL ORDER BY i.id`)
  ).rows as {
    id: string;
    name: string;
    kind: string;
    kept_agents: number;
    useful_records: number;
  }[];
  const done =
    (await tx.execute(sql`SELECT id FROM demo_provision_runs WHERE id=${cleanupId}`)).rows.length >
    0;
  const remove = accounts.filter((a) => !keep.includes(a.email.toLowerCase()));
  const keepAccounts = accounts.filter((a) => keep.includes(a.email.toLowerCase()));
  const removeInstitutions = institutions.filter(
    (i) => i.kind !== 'university' && !Number(i.kept_agents) && !Number(i.useful_records),
  );
  const digest = createHash('sha256')
    .update(JSON.stringify({ accounts, institutions }))
    .digest('hex');
  return {
    done,
    remove,
    keepAccounts,
    removeInstitutions,
    keepInstitutions: institutions.filter((i) => !removeInstitutions.includes(i)),
    digest,
  };
}
export async function commitRequestedCleanup(digest: string, actorId: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(20261125)`);
    await tx.execute(
      sql`LOCK TABLE "user", institutions, institution_agents, portal_entries, institution_content, certificate_records, agent_course_scopes, social_posts IN SHARE ROW EXCLUSIVE MODE`,
    );
    const preview = await cleanupPreview(tx);
    if (
      preview.done ||
      preview.digest !== digest ||
      preview.keepAccounts.length !== 5 ||
      !preview.keepAccounts.some((a) => a.id === actorId)
    )
      throw Error('Inventory changed or protected accounts missing');
    for (const person of preview.remove) {
      // Keep only an anonymous historical foreign-key target. Never attribute their work to another user.
      await tx.execute(sql`DELETE FROM session WHERE user_id=${person.id}`);
      await tx.execute(sql`DELETE FROM account WHERE user_id=${person.id}`);
      await tx.execute(sql`DELETE FROM platform_admins WHERE user_id=${person.id}`);
      await tx.execute(sql`DELETE FROM institution_agents WHERE user_id=${person.id}`);
      await tx.execute(sql`DELETE FROM memberships WHERE user_id=${person.id}`);
      await tx.execute(sql`DELETE FROM student_profiles WHERE user_id=${person.id}`);
      await tx.execute(sql`DELETE FROM account_preferences WHERE user_id=${person.id}`);
      await tx.execute(
        sql`UPDATE "user" SET name='حساب محذوف',email=${person.id + '@deleted.studenthub.invalid'},image=NULL,gender=NULL,student_code=NULL,email_verified=false,updated_at=now() WHERE id=${person.id}`,
      );
    }
    for (const inst of preview.removeInstitutions) {
      await tx.execute(
        sql`UPDATE institutions SET active=false,deleted_at=now() WHERE id=${inst.id} AND kind<>'university'`,
      );
      await tx.execute(
        sql`UPDATE institution_agents SET status='suspended' WHERE institution_id=${inst.id}`,
      );
    }
    await tx.execute(sql`INSERT INTO demo_provision_runs(id) VALUES(${cleanupId})`);
    return { accounts: preview.remove.length, institutions: preview.removeInstitutions.length };
  });
}
