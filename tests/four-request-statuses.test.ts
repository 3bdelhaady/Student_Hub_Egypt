import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
test('approved legacy request deletion preserves four allowed states and constrains future writes', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE TABLE portal_requests(id text primary key,status text);CREATE TABLE request_messages(id text,request_id text references portal_requests(id) ON DELETE CASCADE);INSERT INTO portal_requests VALUES('p','pending'),('r','reviewing'),('a','accepted'),('c','completed'),('x','rejected'),('y','cancelled');INSERT INTO request_messages VALUES('m','x');`,
    );
    await db.exec(await fs.readFile('migrations/0045_four_request_statuses.sql', 'utf8'));
    assert.equal((await db.query('select * from portal_requests')).rows.length, 4);
    assert.equal((await db.query('select * from request_messages')).rows.length, 0);
    await assert.rejects(db.exec("INSERT INTO portal_requests VALUES('z','rejected')"));
  } finally {
    await db.close();
  }
});
