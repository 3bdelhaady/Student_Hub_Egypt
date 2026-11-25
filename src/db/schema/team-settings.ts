import { pgTable, text, boolean, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { courses } from './content';
import { faculties, universities } from './catalog';
import { institutions } from './institution';
import { user } from './identity';
export const teamCourseSettings = pgTable(
  'team_course_settings',
  {
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    facultyId: text('faculty_id')
      .notNull()
      .references(() => faculties.id),
    institutionId: text('institution_id')
      .notNull()
      .references(() => institutions.id),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    approvalRequired: boolean('approval_required').notNull().default(true),
    enabled: boolean('enabled').notNull().default(false),
    maxMembers: integer('max_members').notNull().default(5),
    conditions: text('conditions').notNull().default(''),
    updatedBy: text('updated_by')
      .notNull()
      .references(() => user.id),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.facultyId] })],
);
export const teamCourseCounters = pgTable('team_course_counters', {
  courseId: text('course_id')
    .primaryKey()
    .references(() => courses.id),
  nextNumber: integer('next_number').notNull().default(0),
});
