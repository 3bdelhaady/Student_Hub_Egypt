import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { user } from './identity';
import { universities } from './catalog';
export const auditEvents = pgTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').references(() => user.id),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    action: text('action').notNull(),
    entityId: text('entity_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('audit_scope_created_idx').on(t.universityId, t.createdAt)],
);

export const integrationTokens = pgTable('integration_tokens', {
  id: text('id').primaryKey(),
  universityId: text('university_id')
    .notNull()
    .references(() => universities.id),
  digest: text('digest').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  windowStartedAt: timestamp('window_started_at').notNull().defaultNow(),
  requestCount: integer('request_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
