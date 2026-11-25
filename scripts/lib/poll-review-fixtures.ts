import type { db as Database } from '../../src/db';
import * as s from '../../src/db/schema';
import { eq, inArray } from 'drizzle-orm';
export async function seedPollReviewFixtures(db: typeof Database, voterEmails: string[]) {
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
    throw new Error('Poll fixtures require disposable local database');
  const [owner] = await db
    .select({ id: s.user.id })
    .from(s.user)
    .where(eq(s.user.email, 'demo.admin@studenthub.test'))
    .limit(1);
  if (!owner) throw new Error('Missing local fixture owner');
  const variants = ['open', 'closed', 'upcoming', 'disabled', 'hidden', 'draft'];
  const ids = variants.map((name) => 'voice-fixture-' + name);
  await db.delete(s.pollVotes).where(inArray(s.pollVotes.entryId, ids));
  await db.delete(s.portalSaved).where(inArray(s.portalSaved.entryId, ids));
  await db.delete(s.pollOptions).where(inArray(s.pollOptions.entryId, ids));
  await db.delete(s.portalEntries).where(inArray(s.portalEntries.id, ids));
  for (const variant of variants) {
    const hidden = variant === 'hidden';
    await db.insert(s.portalEntries).values({
      id: 'voice-fixture-' + variant,
      institutionId: hidden ? 'luxor-institution' : 'demo-library',
      universityId: hidden ? 'luxor-national' : null,
      department: hidden ? 'student_union' : 'private_sector',
      kind: 'poll',
      title: 'استبيان محلي ' + variant,
      description: 'تصويت اصطناعي في قاعدة اختبار محلية فقط للتحقق من السلوك الفعلي والخصوصية.',
      category: 'اختبار محلي',
      authorId: owner.id,
      published: variant !== 'draft',
      capacity: variant === 'disabled' ? 0 : null,
      startsAt: variant === 'upcoming' ? new Date(Date.now() + 7 * 86400000) : null,
      closesAt: variant === 'closed' ? new Date(Date.now() - 86400000) : null,
    });
    await db.insert(s.pollOptions).values(
      ['a', 'b'].map((suffix, index) => ({
        id: `voice-fixture-${variant}-${suffix}`,
        entryId: 'voice-fixture-' + variant,
        label: index === 0 ? 'الخيار الأول' : 'الخيار الثاني',
      })),
    );
  }
  const voters = await db
    .select({ id: s.user.id })
    .from(s.user)
    .where(inArray(s.user.email, voterEmails));
  if (voters.length < 3) throw new Error('Missing local fixture voters');
  await db.insert(s.pollVotes).values(
    voters.slice(0, 3).map((voter, index) => ({
      id: crypto.randomUUID(),
      entryId: 'voice-fixture-closed',
      optionId: index < 2 ? 'voice-fixture-closed-a' : 'voice-fixture-closed-b',
      userId: voter.id,
    })),
  );
}
