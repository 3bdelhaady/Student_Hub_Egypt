'use server';
import { reportFailure } from '@/lib/diagnostics';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  academicTeamMembers,
  academicTeamJoinDecisions,
  portalRequests,
  portalEntries,
  portalNotifications,
} from '@/db/schema';
import { requireStudentViewer } from '@/lib/session';
import { activeStudentEntryScope } from '@/modules/portal/queries';
import { canStudentReadEntry } from '@/modules/portal/policy';
import { refresh, type FormState } from '@/modules/shared/form-state';
export async function decideTeamJoin(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const id = String(form.get('requestId') || '');
  const outcome = String(form.get('outcome') || '');
  if (!['accepted', 'declined'].includes(outcome)) return { error: 'اختر القرار.' };
  try {
    await db.transaction(async (tx) => {
      const [r] = await tx
        .select()
        .from(portalRequests)
        .where(eq(portalRequests.id, id))
        .for('update')
        .limit(1);
      if (!r || r.kind !== 'team' || !r.entryId || !['pending', 'reviewing'].includes(r.status))
        throw Error('request');
      const [e] = await tx
        .select()
        .from(portalEntries)
        .where(eq(portalEntries.id, r.entryId))
        .for('update')
        .limit(1);
      const [leader] = await tx
        .select()
        .from(academicTeamMembers)
        .where(
          and(
            eq(academicTeamMembers.entryId, r.entryId),
            eq(academicTeamMembers.userId, v.user.id),
            eq(academicTeamMembers.role, 'leader'),
          ),
        )
        .limit(1);
      if (
        !e ||
        !leader ||
        r.userId === v.user.id ||
        !canStudentReadEntry(v.membership, e, await activeStudentEntryScope(e, v.membership, tx))
      )
        throw Error('permission');
      if (outcome === 'accepted') {
        if (e.capacity !== null && e.capacity < 1) throw Error('full');
        const [member] = await tx
          .select()
          .from(academicTeamMembers)
          .where(
            and(eq(academicTeamMembers.entryId, e.id), eq(academicTeamMembers.userId, r.userId)),
          )
          .limit(1);
        if (member) throw Error('member');
        await tx
          .insert(academicTeamMembers)
          .values({ entryId: e.id, userId: r.userId, role: 'member' });
        if (e.capacity !== null)
          await tx
            .update(portalEntries)
            .set({ capacity: e.capacity - 1 })
            .where(eq(portalEntries.id, e.id));
      }
      await tx
        .insert(academicTeamJoinDecisions)
        .values({ requestId: id, outcome, decidedBy: v.user.id });
      await tx
        .update(portalRequests)
        .set({ status: outcome === 'accepted' ? 'accepted' : 'completed', updatedAt: new Date() })
        .where(eq(portalRequests.id, id));
      await tx.insert(portalNotifications).values({
        id: crypto.randomUUID(),
        userId: r.userId,
        title: outcome === 'accepted' ? 'تم قبول انضمامك للفريق' : 'لم تتم الموافقة على الانضمام',
        body: r.reference,
        href: '/requests/' + id,
      });
    });
    refresh();
    return { success: 'تم حفظ قرار الانضمام.' };
  } catch {
    reportFailure('modules.academic-teams.member-actions');
    return { error: 'تعذر حفظ القرار، تحقق من صلاحيتك وسعة الفريق.' };
  }
}
