import { PGlite } from '@electric-sql/pglite';
import { drizzle as localDrizzle } from 'drizzle-orm/pglite';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';
const globalDb = globalThis as unknown as {
  hubDb?: ReturnType<typeof localDrizzle>;
  hubLocal?: PGlite;
};
function connect() {
  if (process.env.DATABASE_URL)
    return pgDrizzle(new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }), {
      schema,
    }) as unknown as ReturnType<typeof localDrizzle>;
  if (
    process.env.VERCEL ||
    (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== 'true')
  )
    throw new Error('Production requires DATABASE_URL');
  const directory = path.resolve('.data');
  fs.mkdirSync(directory, { recursive: true });
  globalDb.hubLocal ??= new PGlite(path.join(directory, 'postgres'));
  return localDrizzle(globalDb.hubLocal, { schema });
}
export const db = (globalDb.hubDb ??= connect());
