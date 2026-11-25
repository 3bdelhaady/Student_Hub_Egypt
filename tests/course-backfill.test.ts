import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
test('owner-approved course faculty backfill is idempotent and preserves other course scopes', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE TABLE courses(id text primary key,university_id text);CREATE TABLE student_organizations(id text,institution_id text,university_id text,faculty_id text,kind text);CREATE TABLE agent_course_scopes(course_id text primary key,institution_id text,university_id text,faculty_id text,organization_id text,department text);INSERT INTO courses VALUES('math-2','demo-university'),('programming','demo-university'),('communication','demo-university'),('presentation-v2-course','demo-university'),('other','demo-university');INSERT INTO student_organizations VALUES('demo-union-computing','demo-institution','demo-university','demo-computing','student_union');INSERT INTO agent_course_scopes VALUES('other','other','demo-university','other','other','student_union');`,
    );
    const migration = await fs.readFile('migrations/0041_computing_course_scopes.sql', 'utf8');
    await db.exec(migration);
    await db.exec(migration);
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from agent_course_scopes where faculty_id='demo-computing'",
        )
      ).rows[0].n,
      4,
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from agent_course_scopes where faculty_id='other'",
        )
      ).rows[0].n,
      1,
    );
  } finally {
    await db.close();
  }
});
