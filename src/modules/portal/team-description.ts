'use server';
import { reportFailure } from '@/lib/diagnostics';
import { db } from '@/db';
import { portalEntries } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { canManagePortalEntry } from './queries';
import { managedTeamRoster } from './team-roster';
import { refresh, type FormState } from '../shared/form-state';
export async function saveTeamDescription(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const id = String(form.get('id') || ''),
    description = String(form.get('description') || '').trim();
  if (description.length > 12000) return { error: 'الوصف أطول من الحد المسموح.' };
  try {
    const [entry] = await db.select().from(portalEntries).where(eq(portalEntries.id, id)).limit(1);
    if (
      !entry ||
      entry.kind !== 'team' ||
      !entry.teamCourseId ||
      !(await canManagePortalEntry(v, entry)) ||
      !(await managedTeamRoster(v, entry.teamCourseId, id))
    )
      throw Error();
    const saved = await db
      .update(portalEntries)
      .set({ description, updatedAt: new Date() })
      .where(and(eq(portalEntries.id, id), eq(portalEntries.updatedAt, entry.updatedAt)))
      .returning({ id: portalEntries.id });
    if (!saved.length) throw Error();
    refresh();
    return { success: 'تم حفظ وصف الفريق.' };
  } catch {
    reportFailure('modules.portal.team-description');
    return { error: 'تعذر حفظ الوصف. راجع صلاحية إدارة الفريق.' };
  }
}
