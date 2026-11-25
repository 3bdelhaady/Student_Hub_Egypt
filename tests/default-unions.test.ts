import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
test('default union backfill creates only missing faculty unions and preserves prior IDs and activities', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE TABLE faculties(id text primary key,name text,university_id text); CREATE TABLE institutions(id text primary key,university_id text,kind text,created_at timestamp default now()); CREATE TABLE student_organizations(id text primary key,institution_id text,university_id text,faculty_id text,kind text,name text,active boolean); INSERT INTO faculties VALUES ('f1','الحاسبات','u'),('f2','الهندسة','u'); INSERT INTO institutions(id,university_id,kind) VALUES ('i','u','university'); INSERT INTO student_organizations VALUES ('original-union','i','u','f1','student_union','Original',true),('original-activity','i','u','f1','student_activity','Activity',true);`,
    );
    const migration = await fs.readFile('migrations/0030_default_faculty_unions.sql', 'utf8');
    await db.exec(migration);
    await db.exec(migration);
    assert.deepEqual(
      (await db.query<{ id: string }>('select id from student_organizations order by id')).rows.map(
        (r) => r.id,
      ),
      ['default-union-f2', 'original-activity', 'original-union'],
    );
    await db.exec("INSERT INTO faculties VALUES ('f3','الطب','u')");
    await db.exec(migration);
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from student_organizations where kind='student_union'",
        )
      ).rows[0].n,
      3,
    );
  } finally {
    await db.close();
  }
});
