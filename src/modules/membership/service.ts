import { db } from '@/db';
import { memberships, user, auditEvents } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
export async function activateRoster({
  emails,
  universityId,
  actorId,
  integrationId,
}: {
  emails: string[];
  universityId: string;
  actorId: string | null;
  integrationId?: string;
}) {
  const unique = [...new Set(emails)];
  return db.transaction(async (tx) => {
    const matches = await tx
      .select({ id: memberships.id })
      .from(memberships)
      .innerJoin(user, eq(memberships.userId, user.id))
      .where(
        and(
          eq(memberships.universityId, universityId),
          eq(memberships.role, 'student'),
          eq(memberships.status, 'pending'),
          inArray(sql`lower(${user.email})`, unique),
        ),
      );
    let activated = 0;
    for (const match of matches) {
      const changed = await tx
        .update(memberships)
        .set({ status: 'active' })
        .where(and(eq(memberships.id, match.id), eq(memberships.status, 'pending')))
        .returning({ id: memberships.id });
      if (!changed.length) continue;
      activated++;
      await tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId,
        universityId,
        action: integrationId ? 'membership.bulk-activated.api' : 'membership.bulk-activated.csv',
        entityId: match.id,
      });
    }
    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId,
      universityId,
      action: `activation.batch.completed.${activated}-of-${unique.length}`,
      entityId: integrationId || actorId!,
    });
    return {
      received: unique.length,
      activated,
      unchangedOrNotEligible: unique.length - activated,
    };
  });
}
