import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
test('legacy pending team requests recover into scoped unpublished teams without approval or cross faculty reassignment', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE portal_requests(id text,entry_id text,kind text,status text,subject text,body text,user_id text);CREATE TABLE academic_team_proposals(request_id text,course_id text,university_id text,marker text);CREATE TABLE agent_course_scopes(course_id text,institution_id text,university_id text,faculty_id text,organization_id text,department text);CREATE TABLE memberships(user_id text,faculty_id text,university_id text);CREATE TABLE team_course_settings(course_id text,faculty_id text,max_members int);CREATE TABLE portal_entries(id text primary key,institution_id text,university_id text,faculty_id text,organization_id text,department text,kind text,title text,description text,team_course_id text,team_marker text,capacity int,published boolean,author_id text);
INSERT INTO agent_course_scopes VALUES('course','i','u','f','o','student_union');INSERT INTO memberships VALUES('owner','f','u'),('foreign','g','u');INSERT INTO team_course_settings VALUES('course','f',5);
INSERT INTO portal_requests VALUES('yes',NULL,'team_creation','pending','Team','Description','owner'),('no',NULL,'team_creation','pending','Other','Description','foreign'),('closed',NULL,'team_creation','rejected','Closed','Description','owner');INSERT INTO academic_team_proposals VALUES('yes','course','u','A'),('no','course','u','B'),('closed','course','u','C');`);
    const m = await fs.readFile('migrations/0044_legacy_team_proposals.sql', 'utf8');
    await db.exec(m);
    await db.exec(m);
    const rows = await db.query<{ id: string; published: boolean; capacity: number }>(
      'select id,published,capacity from portal_entries',
    );
    assert.deepEqual(rows.rows, [{ id: 'legacy-team-yes', published: false, capacity: 4 }]);
    const requests = await db.query<{ id: string; entry_id: string | null; status: string }>(
      'select id,entry_id,status from portal_requests order by id',
    );
    assert.deepEqual(requests.rows, [
      { id: 'closed', entry_id: null, status: 'rejected' },
      { id: 'no', entry_id: null, status: 'pending' },
      { id: 'yes', entry_id: 'legacy-team-yes', status: 'pending' },
    ]);
  } finally {
    await db.close();
  }
});
