import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
test('approved identity deletion removes ciphertext and fingerprint storage but preserves credentials and account code', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE TABLE "user"(id text, email text,password_hash text,national_id_fingerprint text,student_code text);CREATE TABLE national_id_vault(user_id text,ciphertext text);INSERT INTO "user" VALUES('u','same@example.test','unchanged','fingerprint','STMF123');INSERT INTO national_id_vault VALUES('u','ciphertext');`,
    );
    await db.exec(await fs.readFile('migrations/0040_remove_national_identity.sql', 'utf8'));
    assert.equal(
      (await db.query<{ t: string | null }>("SELECT to_regclass('national_id_vault') AS t")).rows[0]
        .t,
      null,
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "SELECT count(*)::int n FROM information_schema.columns WHERE table_name='user' AND column_name='national_id_fingerprint'",
        )
      ).rows[0].n,
      0,
    );
    assert.deepEqual((await db.query('SELECT * FROM "user"')).rows, [
      { id: 'u', email: 'same@example.test', password_hash: 'unchanged', student_code: 'STMF123' },
    ]);
  } finally {
    await db.close();
  }
});
