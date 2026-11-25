import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import fs from 'node:fs/promises';
import * as schema from '../src/db/schema';
import { allocateTeamMarker } from '../src/modules/academic-teams/settings';
test('course counters start independently, serialize allocations, skip legacy symbols and reject disabled settings', async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  try {
    for (const name of (await fs.readdir('migrations')).filter((n) => n.endsWith('.sql')).sort())
      await client.exec(await fs.readFile('migrations/' + name, 'utf8'));
    await client.exec(
      `INSERT INTO "user"(id,name,email)VALUES('owner','Owner','owner@example.test');INSERT INTO universities(id,name,city)VALUES('u','U','C');INSERT INTO faculties(id,university_id,name)VALUES('f','u','F');INSERT INTO institutions(id,university_id,name,kind)VALUES('i','u','I','university');INSERT INTO courses(id,university_id,title,description,category,instructor,published)VALUES('a','u','A','Description here','C','T',true),('b','u','B','Description here','C','T',true),('c','u','C','Description here','C','T',true);INSERT INTO team_course_settings(course_id,faculty_id,institution_id,university_id,enabled,max_members,conditions,updated_by)VALUES('a','f','i','u',true,5,'Condition','owner'),('b','f','i','u',true,4,'','owner'),('c','f','i','u',false,5,'','owner');`,
    );
    const allocate = (course: string) =>
      db.transaction((tx) => allocateTeamMarker(tx as never, course, 'f'));
    assert.equal((await allocate('a')).marker, 'A');
    assert.equal((await allocate('b')).marker, 'A');
    const results = await Promise.all([allocate('a'), allocate('a')]);
    assert.deepEqual(results.map((r) => r.marker).sort(), ['B', 'C']);
    assert.ok(results.every((r) => r.maxMembers === 5 && r.conditions === 'Condition'));
    await assert.rejects(allocate('c'));
    await assert.rejects(db.transaction((tx) => allocateTeamMarker(tx as never, 'a', 'other')));
    await client.exec(
      `INSERT INTO portal_entries(id,institution_id,department,kind,title,description,author_id,team_course_id,university_id,team_marker)VALUES('legacy','i','student_union','team','Legacy','Description','owner','c','u','F');UPDATE team_course_settings SET enabled=true WHERE course_id='c';`,
    );
    assert.equal((await allocate('c')).marker, 'G');
    await assert.rejects(
      client.exec(`UPDATE team_course_settings SET max_members=0 WHERE course_id='a'`),
    );
  } finally {
    await client.close();
  }
});
