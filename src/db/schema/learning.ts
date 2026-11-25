import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { user } from './identity';
import { courses, resources } from './content';
export const savedCourses = pgTable(
  'saved_courses',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('saved_courses_user_created_idx').on(t.userId, t.createdAt),
    uniqueIndex('saved_course_user').on(t.userId, t.courseId),
  ],
);

export const resourceProgress = pgTable(
  'resource_progress',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('progress_resource_user').on(t.userId, t.resourceId)],
);
