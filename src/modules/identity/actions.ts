'use server';
import { reportFailure } from '@/lib/diagnostics';
import { z } from 'zod';
import { db } from '@/db';
import { requireViewer } from '@/lib/session';
import { eq } from 'drizzle-orm';
import { type FormState, text, refresh, fail } from '../shared/form-state';
import {
  user,
  accountPreferences,
  institutions,
  faculties,
  studentOrganizations,
} from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const data = z.object({ name: text(2, 100) }).safeParse(Object.fromEntries(form));
  if (!data.success) return { error: 'اكتب اسمًا من حرفين إلى ١٠٠ حرف.' };
  try {
    await db
      .update(user)
      .set({ name: data.data.name, updatedAt: new Date() })
      .where(eq(user.id, v.user.id));
    refresh();
    return { success: 'تم حفظ الاسم.' };
  } catch {
    reportFailure('modules.identity.actions');
    return fail();
  }
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect('/login');
}

// A view preference, never a new role or an authorization grant.
export async function setAccountMode(form: FormData) {
  const v = await requireViewer();
  if (v.membership?.role !== 'student' || !v.institutionAgent)
    redirect('/settings?modeError=unavailable');
  const mode = form.get('mode');
  if (mode !== 'student' && mode !== 'agent') redirect('/settings?modeError=invalid');
  if (mode === 'agent') {
    const a = v.institutionAgent;
    if (!a || a.status !== 'active' || !a.canRead) redirect('/settings?modeError=unavailable');
    const [i] = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, a.institutionId))
      .limit(1);
    const [f] = a.facultyId
      ? await db.select().from(faculties).where(eq(faculties.id, a.facultyId)).limit(1)
      : [];
    const [o] = a.organizationId
      ? await db
          .select()
          .from(studentOrganizations)
          .where(eq(studentOrganizations.id, a.organizationId))
          .limit(1)
      : [];
    if (!i?.active || (a.facultyId && !f?.active) || (a.organizationId && !o?.active))
      redirect('/settings?modeError=unavailable');
  }
  await db
    .insert(accountPreferences)
    .values({ userId: v.user.id, activeMode: mode })
    .onConflictDoUpdate({
      target: accountPreferences.userId,
      set: { activeMode: mode, updatedAt: new Date() },
    });
  refresh();
  redirect(mode === 'agent' ? '/agent' : '/account?view=student');
}
