import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { portalEntries, portalRequests } from './portal';
import { user } from './identity';
export const academicTeamMembers = pgTable(
  'academic_team_members',
  {
    entryId: text('entry_id')
      .notNull()
      .references(() => portalEntries.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    role: text('role').notNull().default('member'),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.userId] })],
);
export const academicTeamJoinDecisions = pgTable('academic_team_join_decisions', {
  requestId: text('request_id')
    .primaryKey()
    .references(() => portalRequests.id, { onDelete: 'cascade' }),
  outcome: text('outcome').notNull(),
  decidedBy: text('decided_by')
    .notNull()
    .references(() => user.id),
  decidedAt: timestamp('decided_at').notNull().defaultNow(),
});
