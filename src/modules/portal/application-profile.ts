import { createHash } from 'node:crypto';
import { db } from '@/db';
import { studentProfiles, universities, faculties, user, memberships } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Tx } from '../institution/service';
export async function applicationProfile(userId: string, tx: Tx | typeof db = db) {
  const [account] = await tx
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const [member] = await tx
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);
  const [profile] = await tx
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1);
  const [university] = member
    ? await tx
        .select({ name: universities.name })
        .from(universities)
        .where(eq(universities.id, member.universityId))
        .limit(1)
    : [];
  const [faculty] = member?.facultyId
    ? await tx
        .select({ name: faculties.name })
        .from(faculties)
        .where(eq(faculties.id, member.facultyId))
        .limit(1)
    : [];
  const fields = [
    ['الاسم', account?.name || ''],
    ['البريد الإلكتروني', account?.email || ''],
    ['الهاتف', profile?.phone || 'غير مسجل'],
    ['الجامعة', university?.name || 'غير مسجلة'],
    ['الكلية', faculty?.name || member?.faculty || 'غير مسجلة'],
    ['المستوى الدراسي', profile?.level || 'غير مسجل'],
  ];
  const body = fields.map(([label, value]) => label + ': ' + value).join('\n');
  return { fields, body, digest: createHash('sha256').update(body).digest('hex') };
}
