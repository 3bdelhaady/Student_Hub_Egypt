import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';
import { institutions } from '../src/db/schema';
// Same predicate used by listings; unknown/guest/different-governorate are denied.
test('restaurant listing predicate cannot expose other governorates or unset locations', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE TABLE universities(id text, governorate text); CREATE TABLE institutions(id text,kind text,category text,governorate text); INSERT INTO universities VALUES ('q','قنا'),('l','الأقصر'); INSERT INTO institutions VALUES ('online','private_sector','general',''),('qrestaurant','private_sector','restaurant','قنا'),('lrestaurant','private_sector','restaurant','الأقصر'),('unknown','private_sector','restaurant','');`,
    );
    const d = drizzle(db);
    for (const [id, expected] of [
      ['q', ['online', 'qrestaurant']],
      ['l', ['lrestaurant', 'online']],
      ['missing', ['online']],
    ] as const) {
      const result = await d.execute(
        sql`select id from ${institutions} where kind <> 'private_sector' or category <> 'restaurant' or (governorate <> '' and governorate = (select governorate from universities where id = ${id})) order by id`,
      );
      assert.deepEqual(
        result.rows.map((r) => r.id),
        expected,
      );
    }
  } finally {
    await db.close();
  }
});
