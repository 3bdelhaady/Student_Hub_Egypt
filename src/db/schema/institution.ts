import {
  pgTable,
  jsonb,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/pg-core';
import type { SectionPermissions } from '../../modules/institution/section-policy';
import { user } from './identity';
import { universities, faculties } from './catalog';
export const platformAdmins = pgTable('platform_admins', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
export const institutions = pgTable(
  'institutions',
  {
    id: text('id').primaryKey(),
    universityId: text('university_id').references(() => universities.id),
    name: text('name').notNull(),
    kind: text('kind', { enum: ['university', 'private_sector'] }).notNull(),
    category: text('category', { enum: ['general', 'restaurant'] })
      .notNull()
      .default('general'),
    governorate: text('governorate').notNull().default(''),
    description: text('description').notNull().default(''),
    website: text('website').notNull().default(''),
    restaurantInfo:
      jsonb('restaurant_info').$type<
        import('../../modules/institution/restaurant-info').InstitutionRestaurantInfo
      >(),
    active: boolean('active').notNull().default(true),
    demo: boolean('demo').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('institutions_id_university_unique').on(t.id, t.universityId)],
);
export const studentOrganizations = pgTable(
  'student_organizations',
  {
    id: text('id').primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    facultyId: text('faculty_id')
      .notNull()
      .references(() => faculties.id),
    kind: text('kind', { enum: ['student_union', 'student_activity'] }).notNull(),
    name: text('name').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('organizations_scope_unique').on(t.id, t.institutionId, t.facultyId),
    uniqueIndex('organizations_scope_kind_unique').on(t.id, t.institutionId, t.facultyId, t.kind),
    foreignKey({
      columns: [t.institutionId, t.universityId],
      foreignColumns: [institutions.id, institutions.universityId],
    }),
    foreignKey({
      columns: [t.facultyId, t.universityId],
      foreignColumns: [faculties.id, faculties.universityId],
    }),
  ],
);
export const institutionAgents = pgTable(
  'institution_agents',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id').references(() => universities.id),
    facultyId: text('faculty_id').references(() => faculties.id),
    organizationId: text('organization_id').references(() => studentOrganizations.id),
    department: text('department', {
      enum: [
        'student_affairs',
        'youth_welfare',
        'private_sector',
        'student_union',
        'student_activity',
      ],
    }).notNull(),
    position: text('position', {
      enum: ['representative', 'president', 'vice_president', 'member'],
    }).notNull(),
    isSuperAgent: boolean('is_super_agent').notNull().default(false),
    sectionPermissions: jsonb('section_permissions').$type<SectionPermissions>(),
    canRead: boolean('can_read').notNull().default(true),
    canEdit: boolean('can_edit').notNull().default(false),
    canPublish: boolean('can_publish').notNull().default(false),
    status: text('status', { enum: ['pending', 'active', 'suspended'] })
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('institution_agents_scope_status_idx').on(
      t.institutionId,
      t.facultyId,
      t.department,
      t.status,
    ),
    foreignKey({
      columns: [t.institutionId, t.universityId],
      foreignColumns: [institutions.id, institutions.universityId],
    }),
    foreignKey({
      columns: [t.facultyId, t.universityId],
      foreignColumns: [faculties.id, faculties.universityId],
    }),
    foreignKey({
      columns: [t.organizationId, t.institutionId, t.facultyId, t.department],
      foreignColumns: [
        studentOrganizations.id,
        studentOrganizations.institutionId,
        studentOrganizations.facultyId,
        studentOrganizations.kind,
      ],
    }),
  ],
);
export const institutionContent = pgTable(
  'institution_content',
  {
    id: text('id').primaryKey(),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id').references(() => universities.id),
    facultyId: text('faculty_id').references(() => faculties.id),
    organizationId: text('organization_id').references(() => studentOrganizations.id),
    department: text('department').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    published: boolean('published').notNull().default(false),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('institution_content_scope_published_idx').on(
      t.institutionId,
      t.facultyId,
      t.department,
      t.published,
    ),
    foreignKey({
      columns: [t.institutionId, t.universityId],
      foreignColumns: [institutions.id, institutions.universityId],
    }),
    foreignKey({
      columns: [t.facultyId, t.universityId],
      foreignColumns: [faculties.id, faculties.universityId],
    }),
    foreignKey({
      columns: [t.organizationId, t.institutionId, t.facultyId, t.department],
      foreignColumns: [
        studentOrganizations.id,
        studentOrganizations.institutionId,
        studentOrganizations.facultyId,
        studentOrganizations.kind,
      ],
    }),
  ],
);
export const institutionAuditEvents = pgTable(
  'institution_audit_events',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').references(() => user.id),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    action: text('action').notNull(),
    entityId: text('entity_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('institution_audit_scope_created_idx').on(t.institutionId, t.createdAt)],
);
export const demoProvisionRuns = pgTable('demo_provision_runs', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
