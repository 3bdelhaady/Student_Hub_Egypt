import { sql } from 'drizzle-orm';
import type { Tx } from './service';
// Idempotent and non-destructive. Existing organizations and assignments keep their IDs.
export async function ensureDefaultUnions(tx: Tx) {
  await tx.execute(
    sql.raw(`INSERT INTO student_organizations (id,institution_id,university_id,faculty_id,kind,name,active)
    SELECT 'default-union-' || f.id, i.id, f.university_id, f.id, 'student_union', 'اتحاد طلاب ' || f.name, true
    FROM faculties f JOIN LATERAL (
      SELECT id FROM institutions WHERE university_id = f.university_id AND kind = 'university' AND deleted_at IS NULL ORDER BY created_at,id LIMIT 1
    ) i ON true
    WHERE NOT EXISTS (SELECT 1 FROM student_organizations o WHERE o.faculty_id = f.id AND o.kind = 'student_union')
    ON CONFLICT DO NOTHING`),
  );
}
