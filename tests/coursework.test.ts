import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
import { normalizeExternalUrl, externalUrlHost } from '../src/modules/shared/url';

test('external resource URLs accept only full https links on real hosts', () => {
  assert.equal(
    normalizeExternalUrl('https://www.youtube.com/watch?v=abc123'),
    'https://www.youtube.com/watch?v=abc123',
  );
  assert.equal(
    normalizeExternalUrl('  https://drive.google.com/file/d/xyz  '),
    'https://drive.google.com/file/d/xyz',
  );
  for (const bad of [
    '',
    '   ',
    'http://example.com/x',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    '//example.com/x',
    'ftp://example.com/x',
    'https://user:pass@example.com/',
    'https://localhost/',
    'notaurl',
    `https://example.com/${'x'.repeat(2100)}`,
  ])
    assert.equal(normalizeExternalUrl(bad), null, bad);
});

test('externalUrlHost names the destination and survives invalid input', () => {
  assert.equal(externalUrlHost('https://youtu.be/abc'), 'youtu.be');
  assert.equal(externalUrlHost('not a url'), 'not a url');
});

test('course expansion migration enforces kinds, urls and one submission per student', async () => {
  const db = new PGlite();
  try {
    for (const name of (await fs.readdir('migrations')).filter((n) => n.endsWith('.sql')).sort())
      await db.exec(await fs.readFile(`migrations/${name}`, 'utf8'));
    await db.exec(
      `INSERT INTO universities(id,name,city) VALUES ('u1','Test','Test'); INSERT INTO courses(id,university_id,title,description,category,instructor) VALUES ('c1','u1','Title','Test description','Test','Test'); INSERT INTO "user"(id,name,email) VALUES ('s1','S','s@example.test'),('s2','S2','s2@example.test');`,
    );
    await db.exec(
      `INSERT INTO resources(id,course_id,title,kind,body,url,due_at) VALUES
        ('rsec','c1','Section','section','','NULL',NULL),
        ('rassign','c1','Assignment','assignment','Do the thing',NULL,'2030-01-01 12:00'),
        ('rvid','c1','Video','video','Watch this','https://youtu.be/x',NULL);`,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO resources(id,course_id,title,kind,body) VALUES ('rbad','c1','T','quiz','x')`,
      ),
    );
    await db.exec(
      `INSERT INTO assignment_submissions(id,resource_id,user_id,body) VALUES ('sub1','rassign','s1','answer one')`,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO assignment_submissions(id,resource_id,user_id,body) VALUES ('sub2','rassign','s1','duplicate')`,
      ),
    );
    await db.exec(
      `INSERT INTO assignment_submissions(id,resource_id,user_id,body) VALUES ('sub3','rassign','s2','other student')`,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO assignment_submissions(id,resource_id,user_id,body) VALUES ('sub4','rsec','s1','missing kind still allowed by fk')`.replace(
          'rsec',
          'missing-resource',
        ),
      ),
    );
    assert.equal(
      (await db.query(`SELECT * FROM assignment_submissions WHERE resource_id='rassign'`)).rows
        .length,
      2,
    );
    await db.exec(`DELETE FROM resources WHERE id='rassign'`);
    assert.equal((await db.query('SELECT * FROM assignment_submissions')).rows.length, 0);
  } finally {
    await db.close();
  }
});
