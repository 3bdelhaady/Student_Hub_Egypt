import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
test('fresh migrations enforce faculty ownership, one membership and learning references', async () => {
  const db = new PGlite();
  try {
    for (const name of (await fs.readdir('migrations'))
      .filter((name) => name.endsWith('.sql'))
      .sort())
      await db.exec(await fs.readFile(`migrations/${name}`, 'utf8'));
    await db.exec(
      `INSERT INTO universities(id,name,city) VALUES ('u1','Test 1','Test'),('u2','Test 2','Test'); INSERT INTO faculties(id,university_id,name) VALUES ('f1','u1','Faculty 1'),('f2','u2','Faculty 2'); INSERT INTO "user"(id,name,email) VALUES ('s1','Test','s1@example.test');`,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO memberships(id,user_id,university_id,faculty_id) VALUES ('bad','s1','u1','f2')`,
      ),
    );
    await db.exec(
      `INSERT INTO memberships(id,user_id,university_id,faculty_id) VALUES ('good','s1','u1','f1')`,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO memberships(id,user_id,university_id,faculty_id) VALUES ('duplicate','s1','u2','f2')`,
      ),
    );
    await db.exec(
      `INSERT INTO courses(id,university_id,title,description,category,instructor) VALUES ('c1','u1','Title','Test description','Test','Test'); INSERT INTO resources(id,course_id,title,kind,body) VALUES ('r1','c1','Resource','lecture','Test'); INSERT INTO saved_courses(id,user_id,course_id) VALUES ('saved','s1','c1'); INSERT INTO resource_progress(id,user_id,resource_id) VALUES ('progress','s1','r1');`,
    );
    await assert.rejects(
      db.exec(`INSERT INTO saved_courses(id,user_id,course_id) VALUES ('saved-again','s1','c1')`),
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO resource_progress(id,user_id,resource_id) VALUES ('bad-resource','s1','missing')`,
      ),
    );
    await db.exec(`DELETE FROM courses WHERE id='c1'`);
    assert.equal((await db.query('SELECT * FROM saved_courses')).rows.length, 0);
    assert.equal((await db.query('SELECT * FROM resource_progress')).rows.length, 0);
  } finally {
    await db.close();
  }
});
