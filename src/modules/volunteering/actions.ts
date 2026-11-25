'use server';
import { reportFailure } from '@/lib/diagnostics';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  portalEntries,
  portalRequests,
  portalNotifications,
  volunteerDivisions,
  volunteerRequestChoices,
} from '@/db/schema';
import { requireStudentViewer } from '@/lib/session';
import { canStudentReadEntry } from '@/modules/portal/policy';
import { activeStudentEntryScope } from '@/modules/portal/queries';
import { type FormState, refresh } from '@/modules/shared/form-state';
import { volunteerApplicationInput, volunteerApplicationsOpen } from './policy';
export async function applyForVolunteering(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const parsed = volunteerApplicationInput.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'اختر قسمًا متاحًا، وراجع الملاحظات والموافقة على إرسال الطلب.' };
  try {
    await db.transaction(async (tx) => {
      const [entry] = await tx
        .select()
        .from(portalEntries)
        .where(eq(portalEntries.id, parsed.data.entryId))
        .for('update')
        .limit(1);
      if (
        !entry ||
        entry.kind !== 'volunteer' ||
        !volunteerApplicationsOpen(entry) ||
        !canStudentReadEntry(
          v.membership,
          entry,
          await activeStudentEntryScope(entry, v.membership, tx),
        )
      )
        throw new Error('unavailable');
      const [division] = await tx
        .select()
        .from(volunteerDivisions)
        .where(
          and(
            eq(volunteerDivisions.id, parsed.data.divisionId),
            eq(volunteerDivisions.entryId, entry.id),
            eq(volunteerDivisions.active, true),
          ),
        )
        .for('share')
        .limit(1);
      if (!division) throw new Error('division');
      const recent = await tx
        .select({ id: portalRequests.id })
        .from(portalRequests)
        .where(
          and(
            eq(portalRequests.userId, v.user.id),
            sql`${portalRequests.createdAt} > now() - interval '10 minutes'`,
          ),
        )
        .limit(10);
      if (recent.length >= 10) throw new Error('rate');
      const id = crypto.randomUUID(),
        reference = 'SH-' + crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
      const body =
        'طلب تطوع في قسم: ' +
        division.label +
        '.' +
        (parsed.data.notes ? '\n\nملاحظات المتقدم:\n' + parsed.data.notes : '');
      await tx.insert(portalRequests).values({
        id,
        userId: v.user.id,
        entryId: entry.id,
        kind: 'volunteer',
        subject: entry.title,
        body,
        quantity: 1,
        unitPriceMinor: entry.priceMinor,
        reference,
      });
      await tx
        .insert(volunteerRequestChoices)
        .values({ requestId: id, divisionId: division.id, divisionLabel: division.label });
      await tx.insert(portalNotifications).values({
        id: crypto.randomUUID(),
        userId: v.user.id,
        title: 'تم استلام طلب التطوع',
        body: reference,
        href: '/requests/' + id,
      });
    });
    refresh();
    return {
      success: 'وصل طلب التطوع للمراجعة، يمكنك متابعته أو إلغاء الطلب المعلّق من صفحة طلباتي.',
    };
  } catch {
    reportFailure('modules.volunteering.actions');
    return {
      error:
        'تعذر إرسال الطلب، قد يكون القسم أو الفرصة غير متاحين، أو لديك طلب قائم، راجع اختياراتك وطلباتك ثم حاول لاحقًا.',
    };
  }
}
