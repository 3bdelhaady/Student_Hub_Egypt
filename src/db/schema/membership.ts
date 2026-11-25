import { pgTable, text, timestamp, uniqueIndex, index, foreignKey } from 'drizzle-orm/pg-core';
import { user } from './identity';
import { universities, faculties } from './catalog';
export const memberships = pgTable(
  'memberships',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    role: text('role', { enum: ['student', 'editor', 'admin'] })
      .notNull()
      .default('student'),
    status: text('status', { enum: ['pending', 'active', 'rejected', 'suspended'] })
      .notNull()
      .default('pending'),
    faculty: text('faculty').notNull().default(''),
    facultyId: text('faculty_id').references(() => faculties.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('membership_user_university').on(t.userId, t.universityId),
    uniqueIndex('membership_one_per_user').on(t.userId),
    index('memberships_scope_status_idx').on(t.universityId, t.status),
    foreignKey({
      name: 'membership_faculty_university_fk',
      columns: [t.facultyId, t.universityId],
      foreignColumns: [faculties.id, faculties.universityId],
    }),
  ],
);
