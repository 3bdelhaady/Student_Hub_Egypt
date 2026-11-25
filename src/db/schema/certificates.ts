import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { user } from './identity';
import { institutions, studentOrganizations } from './institution';
import { universities, faculties } from './catalog';
export const certificateRecords = pgTable(
  'certificate_records',
  {
    id: text('id').primaryKey(),
    serial: text('serial').notNull().unique(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id').references(() => universities.id),
    facultyId: text('faculty_id').references(() => faculties.id),
    organizationId: text('organization_id').references(() => studentOrganizations.id),
    department: text('department').notNull(),
    recipientName: text('recipient_name').notNull(),
    certificateTitle: text('certificate_title').notNull(),
    issuedOn: text('issued_on').notNull(),
    deleted: boolean('deleted').notNull().default(false),
    published: boolean('published').notNull().default(false),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('certificate_scope_idx').on(t.institutionId, t.facultyId)],
);
export const certificateLookupAttempts = pgTable(
  'certificate_lookup_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('certificate_lookup_rate_idx').on(t.userId, t.createdAt)],
);

export const certificateChanges = pgTable(
  'certificate_changes',
  {
    id: text('id').primaryKey(),
    recordId: text('record_id'),
    serial: text('serial').notNull(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id').references(() => universities.id),
    facultyId: text('faculty_id').references(() => faculties.id),
    organizationId: text('organization_id').references(() => studentOrganizations.id),
    department: text('department').notNull(),
    recipientName: text('recipient_name').notNull(),
    certificateTitle: text('certificate_title').notNull(),
    issuedOn: text('issued_on').notNull(),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id),
    baseUpdatedAt: timestamp('base_updated_at'),
    status: text('status').notNull().default('pending'),
    reviewerId: text('reviewer_id').references(() => user.id),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('certificate_changes_scope_idx').on(t.universityId, t.facultyId, t.status)],
);
