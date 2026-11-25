import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './identity';
export const accountPreferences = pgTable('account_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  activeMode: text('active_mode', { enum: ['student', 'agent'] })
    .notNull()
    .default('student'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
