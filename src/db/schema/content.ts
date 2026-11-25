import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { universities } from './catalog';
export const courses = pgTable(
  'courses',
  {
    id: text('id').primaryKey(),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    code: text('code').notNull().default(''),
    category: text('category').notNull(),
    instructor: text('instructor').notNull(),
    published: boolean('published').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('courses_scope_published_idx').on(t.universityId, t.published, t.createdAt),
    uniqueIndex('courses_id_university_unique').on(t.id, t.universityId),
  ],
);

export const resources = pgTable(
  'resources',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    kind: text('kind', { enum: ['lecture', 'file', 'section', 'assignment', 'video'] }).notNull(),
    body: text('body').notNull(),
    url: text('url'),
    dueAt: timestamp('due_at'),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('resources_course_position_idx').on(t.courseId, t.position)],
);

export const posts = pgTable(
  'posts',
  {
    id: text('id').primaryKey(),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull(),
    body: text('body').notNull(),
    kind: text('kind', { enum: ['news', 'opportunity'] }).notNull(),
    category: text('category').notNull(),
    published: boolean('published').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('posts_scope_published_idx').on(t.universityId, t.published, t.createdAt)],
);
