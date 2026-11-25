import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { user } from './identity';
import { resources } from './content';

export const assignmentSubmissions = pgTable(
  'assignment_submissions',
  {
    id: text('id').primaryKey(),
    resourceId: text('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    url: text('url'),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('submission_resource_user').on(t.resourceId, t.userId),
    index('submissions_resource_idx').on(t.resourceId),
  ],
);
