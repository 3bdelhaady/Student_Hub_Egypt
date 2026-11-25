import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
test('ticket consolidation preserves IDs, request snapshots and archived training history', async () => {
  const db = new PGlite();
  try {
    const migrations = (await fs.readdir('migrations')).filter((n) => n.endsWith('.sql')).sort();
    for (const m of migrations.filter((n) => n < '0026'))
      await db.exec(await fs.readFile('migrations/' + m, 'utf8'));
    await db.exec(
      `INSERT INTO "user"(id,name,email) VALUES ('owner','Test','test@example.test'); INSERT INTO institutions(id,name,kind) VALUES ('i','Test provider','private_sector'); INSERT INTO portal_entries(id,institution_id,department,kind,title,description,author_id,published) VALUES ('t','i','private_sector','trip','Trip','Trip test description','owner',true),('c','i','private_sector','ticket','Concert','Concert test description','owner',true),('x','i','private_sector','training','Training','Training test description','owner',true); INSERT INTO portal_requests(id,user_id,entry_id,kind,subject,body,reference,unit_price_minor) VALUES ('r','owner','t','trip','Trip request','Test request','R',12345),('rx','owner','x','training','Training request','Test request','RX',999);`,
    );
    await db.exec(await fs.readFile('migrations/0026_ticket_consolidation.sql', 'utf8'));
    const entries = (
      await db.query<{
        id: string;
        kind: string;
        ticket_type: string;
        archived: boolean;
        published: boolean;
      }>('SELECT id,kind,ticket_type,archived,published FROM portal_entries ORDER BY id')
    ).rows;
    assert.deepEqual(entries, [
      { id: 'c', kind: 'ticket', ticket_type: 'concert', archived: false, published: true },
      { id: 't', kind: 'ticket', ticket_type: 'trip', archived: false, published: true },
      { id: 'x', kind: 'training', ticket_type: '', archived: true, published: false },
    ]);
    assert.deepEqual(
      (await db.query('SELECT id,entry_id,kind,unit_price_minor FROM portal_requests ORDER BY id'))
        .rows,
      [
        { id: 'r', entry_id: 't', kind: 'trip', unit_price_minor: 12345 },
        { id: 'rx', entry_id: 'x', kind: 'training', unit_price_minor: 999 },
      ],
    );
    await assert.rejects(db.exec("UPDATE portal_entries SET published=true WHERE id='x'"));
  } finally {
    await db.close();
  }
});
