import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { user } from './identity';
export const personalLearningCourses = pgTable(
  'personal_learning_courses',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('personal_learning_owner').on(t.userId, t.updatedAt)],
);
export const personalLearningResources = pgTable(
  'personal_learning_resources',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => personalLearningCourses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    url: text('url').notNull().default(''),
    position: integer('position').notNull().default(0),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('personal_learning_resource_order').on(t.courseId, t.position, t.createdAt)],
);
