import { pgTable, text, boolean, uniqueIndex } from 'drizzle-orm/pg-core';

export const universities = pgTable('universities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  governorate: text('governorate').notNull().default(''),
});

export const faculties = pgTable(
  'faculties',
  {
    id: text('id').primaryKey(),
    universityId: text('university_id')
      .notNull()
      .references(() => universities.id),
    name: text('name').notNull(),
    active: boolean('active').notNull().default(true),
  },
  (t) => [
    uniqueIndex('faculty_university_name').on(t.universityId, t.name),
    uniqueIndex('faculties_id_university_unique').on(t.id, t.universityId),
  ],
);
