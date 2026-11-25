import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
test('governorate rollout keeps existing institution identities and global resource scope intact', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE TABLE universities (id text primary key); CREATE TABLE institutions (id text primary key, university_id text, kind text); INSERT INTO universities VALUES ('demo-university'),('luxor-national'),('unknown'); INSERT INTO institutions VALUES ('qena','demo-university','university'),('luxor','luxor-national','university'),('existing-store',null,'private_sector');`,
    );
    await db.exec(await fs.readFile('migrations/0029_institution_governorates.sql', 'utf8'));
    assert.deepEqual(
      (await db.query('select id,governorate,category from institutions order by id')).rows,
      [
        { id: 'existing-store', governorate: '', category: 'general' },
        { id: 'luxor', governorate: 'الأقصر', category: 'general' },
        { id: 'qena', governorate: 'قنا', category: 'general' },
      ],
    );
    assert.equal(
      (
        await db.query<{ governorate: string }>(
          "select governorate from universities where id='unknown'",
        )
      ).rows[0].governorate,
      '',
    );
    await db.exec(await fs.readFile('migrations/0029_institution_governorates.sql', 'utf8'));
  } finally {
    await db.close();
  }
});
