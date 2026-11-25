import { db } from '@/db';
import { faculties, institutions, memberships, user } from '@/db/schema';
import { count, eq, and, sql } from 'drizzle-orm';
export async function platformCounts() {
  const [f, i, s] = await Promise.all([
    db.select({ n: count() }).from(faculties).where(eq(faculties.active, true)),
    db
      .select({ n: count() })
      .from(institutions)
      .where(and(eq(institutions.active, true), eq(institutions.demo, false))),
    db
      .select({ n: count() })
      .from(memberships)
      .innerJoin(user, eq(memberships.userId, user.id))
      .where(
        and(
          eq(memberships.role, 'student'),
          eq(memberships.status, 'active'),
          sql`${user.email} !~* '(@studenthub[.]test$|[.]test$|^demo[._-]|^fixture[._-])'`,
        ),
      ),
  ]);
  return { faculties: f[0].n, institutions: i[0].n, students: s[0].n };
}
