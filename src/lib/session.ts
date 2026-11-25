import { cache } from 'react';
import { needsEmailVerification } from '@/modules/identity/email-security';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { studentLoginPath } from '@/modules/shared/return-path';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { db } from '@/db';
import {
  memberships,
  platformAdmins,
  institutionAgents,
  accountPreferences,
  user,
} from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { createStudentCode, parseGender } from '@/modules/identity/student-code';
export const viewer = cache(async function viewer() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s || needsEmailVerification(s.user)) return null;
  const [memberRows, adminRows, agentRows, preferences] = await Promise.all([
    db.select().from(memberships).where(eq(memberships.userId, s.user.id)).limit(1),
    db.select().from(platformAdmins).where(eq(platformAdmins.userId, s.user.id)).limit(1),
    db.select().from(institutionAgents).where(eq(institutionAgents.userId, s.user.id)).limit(1),
    db.select().from(accountPreferences).where(eq(accountPreferences.userId, s.user.id)).limit(1),
  ]);
  const [identity] = await db
    .select({ code: user.studentCode, gender: user.gender, kind: user.signupKind })
    .from(user)
    .where(eq(user.id, s.user.id))
    .limit(1);
  if (identity && !identity.code) {
    const kind = adminRows.length
      ? 'admin'
      : identity.kind === 'student' &&
          memberRows[0]?.role !== 'student' &&
          ['student_affairs', 'private_sector'].includes(agentRows[0]?.department)
        ? agentRows[0].department
        : identity.kind;
    const gender = parseGender(identity.gender);
    if (gender || kind !== 'student')
      await db
        .update(user)
        .set({ studentCode: createStudentCode(kind, gender) })
        .where(and(eq(user.id, s.user.id), isNull(user.studentCode)));
  }
  return {
    activeMode: preferences[0]?.activeMode || (agentRows[0] ? 'agent' : 'student'),
    user: s.user,
    membership: memberRows[0],
    platformAdmin: adminRows.length > 0,
    institutionAgent: agentRows[0],
  };
});
export async function requireViewer(returnTo?: string) {
  const v = await viewer();
  if (!v) redirect(returnTo ? studentLoginPath(returnTo) : '/login');
  return v;
}

export async function studentAreaViewer() {
  const v = await viewer();
  if (isAgentMode(v)) redirect('/agent');
  return v;
}
export async function requireStudentViewer(returnTo?: string) {
  const v = await requireViewer(returnTo);
  if (isAgentMode(v)) redirect('/agent');
  return v;
}
