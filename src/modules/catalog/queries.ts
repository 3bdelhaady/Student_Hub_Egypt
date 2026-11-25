import { db } from '@/db';
import { universities, faculties } from '@/db/schema';
import { eq } from 'drizzle-orm';
export const listUniversities = () => db.select().from(universities).orderBy(universities.name);
export const listFaculties = () =>
  db.select().from(faculties).where(eq(faculties.active, true)).orderBy(faculties.name);
