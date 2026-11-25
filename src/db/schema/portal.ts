import {
  pgTable,
  jsonb,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { courses } from './content';
import { user } from './identity';
import { institutions } from './institution';
import { universities, faculties } from './catalog';
export const studentProfiles = pgTable('student_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  phone: text('phone').notNull().default(''),
  department: text('department').notNull().default(''),
  level: text('level').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
export const portalEntries = pgTable(
  'portal_entries',
  {
    id: text('id').primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id').references(() => universities.id),
    facultyId: text('faculty_id').references(() => faculties.id),
    organizationId: text('organization_id'),
    department: text('department').notNull(),
    kind: text('kind').notNull(),
    pollAudience: text('poll_audience', { enum: ['faculty', 'university'] })
      .notNull()
      .default('faculty'),
    restaurantDetails: jsonb('restaurant_details')
      .$type<import('../../modules/portal/restaurants').RestaurantDetails>()
      .notNull()
      .default({} as import('../../modules/portal/restaurants').RestaurantDetails),
    housingDetails: jsonb('housing_details')
      .$type<import('../../modules/portal/housing').HousingDetails>()
      .notNull()
      .default({} as import('../../modules/portal/housing').HousingDetails),
    ticketTiers: jsonb('ticket_tiers')
      .$type<import('../../modules/portal/tickets').TicketTier[]>()
      .notNull()
      .default([]),
    ticketType: text('ticket_type').notNull().default(''),
    archived: boolean('archived').notNull().default(false),
    title: text('title').notNull(),
    description: text('description').notNull(),
    opportunityType: text('opportunity_type').notNull().default(''),
    provider: text('provider').notNull().default(''),
    requirements: text('requirements').notNull().default(''),
    teamCourseId: text('team_course_id'),
    teamMarker: text('team_marker').notNull().default(''),
    category: text('category').notNull().default(''),
    imageUrl: text('image_url').notNull().default(''),
    imageUrls: jsonb('image_urls').$type<string[]>().notNull().default([]),
    targetUniversityId: text('target_university_id').references(() => universities.id),
    targetFacultyId: text('target_faculty_id').references(() => faculties.id),
    targetGovernorate: text('target_governorate').notNull().default(''),
    location: text('location').notNull().default(''),
    priceMinor: integer('price_minor').notNull().default(0),
    capacity: integer('capacity'),
    startsAt: timestamp('starts_at'),
    closesAt: timestamp('closes_at'),
    demo: boolean('demo').notNull().default(false),
    published: boolean('published').notNull().default(false),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('portal_entries_scope_idx').on(t.institutionId, t.kind, t.published),
    foreignKey({
      columns: [t.teamCourseId, t.universityId],
      foreignColumns: [courses.id, courses.universityId],
      name: 'portal_team_course_university_fk',
    }),
  ],
);
export const portalRequests = pgTable(
  'portal_requests',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    entryId: text('entry_id').references(() => portalEntries.id),
    kind: text('kind').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    recipientId: text('recipient_id').references(() => user.id),
    paymentMethod: text('payment_method').notNull().default(''),
    paymentStatus: text('payment_status').notNull().default(''),
    purpose: text('purpose').notNull().default(''),
    orderDetails: jsonb('order_details')
      .$type<{
        deposit?: number;
        serviceFee?: number;
        total?: number;
        publisherName?: string;
        ticketTier?: { id: string; title: string; description: string; unitPriceMinor: number };
        items?: { id: string; title: string; quantity: number; unitPriceMinor: number }[];
      }>()
      .notNull()
      .default({}),
    status: text('status').notNull().default('pending'),
    quantity: integer('quantity').notNull().default(1),
    unitPriceMinor: integer('unit_price_minor').notNull().default(0),
    reference: text('reference').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('portal_requests_owner_idx').on(t.userId, t.createdAt)],
);
export const requestMessages = pgTable('request_messages', {
  id: text('id').primaryKey(),
  requestId: text('request_id')
    .notNull()
    .references(() => portalRequests.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
export const portalSaved = pgTable(
  'portal_saved',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    entryId: text('entry_id')
      .notNull()
      .references(() => portalEntries.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('portal_saved_unique').on(t.userId, t.entryId)],
);
export const portalNotifications = pgTable(
  'portal_notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    href: text('href').notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('portal_notifications_owner_idx').on(t.userId, t.createdAt)],
);
export const pollOptions = pgTable('poll_options', {
  id: text('id').primaryKey(),
  entryId: text('entry_id')
    .notNull()
    .references(() => portalEntries.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
});
export const pollVotes = pgTable(
  'poll_votes',
  {
    id: text('id').primaryKey(),
    entryId: text('entry_id')
      .notNull()
      .references(() => portalEntries.id),
    optionId: text('option_id')
      .notNull()
      .references(() => pollOptions.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('poll_one_vote').on(t.entryId, t.userId)],
);

export const academicTeamProposals = pgTable(
  'academic_team_proposals',
  {
    requestId: text('request_id')
      .primaryKey()
      .references(() => portalRequests.id, { onDelete: 'cascade' }),
    courseId: text('course_id').notNull(),
    universityId: text('university_id').notNull(),
    courseTitle: text('course_title').notNull(),
    marker: text('marker').notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.courseId, t.universityId],
      foreignColumns: [courses.id, courses.universityId],
      name: 'team_proposal_course_university_fk',
    }),
  ],
);

export const volunteerDivisions = pgTable(
  'volunteer_divisions',
  {
    id: text('id').primaryKey(),
    entryId: text('entry_id')
      .notNull()
      .references(() => portalEntries.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    description: text('description').notNull().default(''),
    position: integer('position').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (t) => [index('volunteer_divisions_entry').on(t.entryId, t.position)],
);
export const volunteerRequestChoices = pgTable('volunteer_request_choices', {
  requestId: text('request_id')
    .primaryKey()
    .references(() => portalRequests.id, { onDelete: 'cascade' }),
  divisionId: text('division_id').references(() => volunteerDivisions.id, { onDelete: 'set null' }),
  divisionLabel: text('division_label').notNull(),
});

export const portalEntryImages = pgTable('portal_entry_images', {
  id: text('id').primaryKey(),
  entryId: text('entry_id')
    .notNull()
    .references(() => portalEntries.id, { onDelete: 'cascade' }),
  mimeType: text('mime_type').notNull(),
  data: text('data').notNull(),
});
