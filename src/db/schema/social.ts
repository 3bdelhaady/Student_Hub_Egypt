import { pgTable, text, timestamp, index, integer } from 'drizzle-orm/pg-core';
import { user } from './identity';
import { institutions } from './institution';
import { faculties, universities } from './catalog';
export const socialPosts = pgTable(
  'social_posts',
  {
    id: text('id').primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    facultyId: text('faculty_id')
      .notNull()
      .references(() => faculties.id),
    channel: text('channel').notNull(),
    scope: text('scope').notNull(),
    body: text('body').notNull(),
    contentType: text('content_type').notNull().default('text'),
    mediaName: text('media_name'),
    mediaType: text('media_type'),
    mediaSize: integer('media_size'),
    status: text('status').notNull().default('pending'),
    reviewNote: text('review_note').notNull().default(''),
    reviewerId: text('reviewer_id').references(() => user.id),
    scheduledAt: timestamp('scheduled_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('social_posts_scope_idx').on(t.institutionId, t.universityId, t.facultyId),
    index('social_posts_author_idx').on(t.authorId),
  ],
);

export const socialPostMedia = pgTable('social_post_media', {
  postId: text('post_id')
    .primaryKey()
    .references(() => socialPosts.id, { onDelete: 'cascade' }),
  data: text('data').notNull(),
});
