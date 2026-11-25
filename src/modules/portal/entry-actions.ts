'use server';
import { reportFailure } from '@/lib/diagnostics';
import { db } from '@/db';
import { portalEntries, institutionAgents, institutionAuditEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { canManagePortalEntry } from './queries';
import { hasSectionRight, portalSection } from '../institution/section-policy';
import { refresh, type FormState } from '../shared/form-state';
export async function archivePortalEntry(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  try {
    if (form.get('confirm') !== 'on') throw Error();
    await db.transaction(async (tx) => {
      const [e] = await tx
        .select()
        .from(portalEntries)
        .where(eq(portalEntries.id, String(form.get('id') || '')))
        .for('update')
        .limit(1);
      if (
        !e ||
        e.archived ||
        !['service', 'poll', 'product', 'housing', 'restaurant', 'ticket'].includes(e.kind) ||
        !(await canManagePortalEntry(v, e, tx)) ||
        (!v.platformAdmin && e.kind === 'service' && e.authorId !== v.user.id)
      )
        throw Error();
      const [a] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (
        e.published &&
        !v.platformAdmin &&
        !hasSectionRight(a, portalSection(e.kind, e.ticketType), 'canPublish')
      )
        throw Error();
      await tx
        .update(portalEntries)
        .set({ archived: true, published: false, updatedAt: new Date() })
        .where(eq(portalEntries.id, e.id));
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: e.institutionId,
        entityId: e.id,
        action: 'portal.archived',
      });
    });
    refresh();
    return { success: 'تم حذف العنصر من العرض، الطلبات والسجل السابق محفوظان.' };
  } catch {
    reportFailure('modules.portal.entry-actions');
    return { error: 'تعذر الحذف، راجع التأكيد وملكية العنصر وصلاحياتك.' };
  }
}
