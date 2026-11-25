import { pgTable, text, foreignKey, index } from 'drizzle-orm/pg-core';
import { courses } from './content';
import { institutions, studentOrganizations } from './institution';
import { universities, faculties } from './catalog';
export const agentCourseScopes = pgTable(
  'agent_course_scopes',
  {
    courseId: text('course_id')
      .primaryKey()
      .references(() => courses.id, { onDelete: 'cascade' }),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    facultyId: text('faculty_id')
      .notNull()
      .references(() => faculties.id),
    organizationId: text('organization_id')
      .notNull()
      .references(() => studentOrganizations.id),
    department: text('department').notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.courseId, t.universityId],
      foreignColumns: [courses.id, courses.universityId],
    }),
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
    index('agent_course_scopes_domain').on(
      t.institutionId,
      t.facultyId,
      t.organizationId,
      t.department,
    ),
  ],
);
