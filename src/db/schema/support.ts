import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { portalRequests } from './portal';
import { institutions, studentOrganizations } from './institution';
import { universities, faculties } from './catalog';
export const supportDestinations = pgTable(
  'support_destinations',
  {
    requestId: text('request_id')
      .primaryKey()
      .references(() => portalRequests.id, { onDelete: 'cascade' }),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    facultyId: text('faculty_id')
      .notNull()
      .references(() => faculties.id),
    organizationId: text('organization_id').references(() => studentOrganizations.id),
    department: text('department').notNull(),
    label: text('label').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('support_destination_scope_idx').on(t.institutionId, t.facultyId, t.department)],
);
