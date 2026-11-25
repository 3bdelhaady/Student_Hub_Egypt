'use server';
import { reportFailure } from '@/lib/diagnostics';
import { z } from 'zod';
import { db } from '@/db';
import { requireViewer } from '@/lib/session';
import { eq, and } from 'drizzle-orm';
import { type FormState, text, refresh, fail } from '../shared/form-state';
import { memberships, faculties, auditEvents, user } from '@/db/schema';
import { canManageMembers } from '@/lib/policy';

export async function joinUniversity(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const [person] = await db.select().from(user).where(eq(user.id, v.user.id)).limit(1);
  if (!person || person.signupKind !== 'student' || v.institutionAgent) return fail();
  if (v.membership)
    return { error: 'لديك طلب أو عضوية بالفعل، تواصل مع مسؤول المجتمع عند الحاجة.' };
  const data = z
    .object({ universityId: text(1, 100), facultyId: text(1, 100) })
    .safeParse(Object.fromEntries(form));
  if (!data.success) return { error: 'اختر الجامعة والكلية من القوائم المتاحة.' };
  try {
    await db.transaction(async (tx) => {
      const [faculty] = await tx
        .select()
        .from(faculties)
        .where(
          and(
            eq(faculties.id, data.data.facultyId),
            eq(faculties.universityId, data.data.universityId),
            eq(faculties.active, true),
          ),
        )
        .limit(1);
      if (!faculty) throw new Error('invalid faculty');
      await tx.insert(memberships).values({
        id: crypto.randomUUID(),
        userId: v.user.id,
        ...data.data,
        faculty: faculty.name,
        role: 'student',
        status: 'pending',
      });
      await tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        universityId: data.data.universityId,
        action: 'membership.requested',
        entityId: v.user.id,
      });
    });
    refresh();
    return { success: 'تم إرسال طلبك، يمكنك متابعة حالته من حسابك.' };
  } catch {
    reportFailure('modules.membership.actions');
    return fail();
  }
}

export async function decideMembership(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (
    !v.platformAdmin ||
    !v.membership ||
    !canManageMembers(v.membership, v.membership.universityId)
  )
    return fail();
  const parsed = z
    .object({ id: text(1, 100), status: z.enum(['active', 'rejected', 'suspended']) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail();
  const universityId = v.membership.universityId;
  try {
    await db.transaction(async (tx) => {
      const changed = await tx
        .update(memberships)
        .set({ status: parsed.data.status })
        .where(
          and(
            eq(memberships.id, parsed.data.id),
            eq(memberships.universityId, universityId),
            eq(memberships.role, 'student'),
          ),
        )
        .returning({ id: memberships.id });
      if (!changed.length) throw new Error('not found');
      await tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        universityId,
        action: `membership.${parsed.data.status}`,
        entityId: parsed.data.id,
      });
    });
    refresh();
    return { success: 'تم تحديث حالة العضوية.' };
  } catch {
    reportFailure('modules.membership.actions');
    return fail();
  }
}

export async function importActivationCsv(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (
    !v.platformAdmin ||
    !v.membership ||
    !canManageMembers(v.membership, v.membership.universityId)
  )
    return fail();
  const file = form.get('csv');
  if (!(file instanceof File) || file.size > 32768 || file.size === 0)
    return { error: 'اختر ملف CSV بحجم لا يتجاوز ٣٢ كيلوبايت.' };
  try {
    const { parseActivationCsv } = await import('@/lib/activation-input');
    const { activateRoster } = await import('@/modules/membership/service');
    const emails = parseActivationCsv(await file.text());
    const result = await activateRoster({
      emails,
      universityId: v.membership.universityId,
      actorId: v.user.id,
    });
    refresh();
    return {
      success: `اكتمل الاستيراد: ${result.activated} عضويات مفعّلة من ${result.received}، غير المؤهل أو المفعّل سابقًا: ${result.unchangedOrNotEligible}.`,
    };
  } catch {
    reportFailure('modules.membership.actions');
    return {
      error: 'تعذر الاستيراد، المطلوب عمود email فقط، ومن ١ إلى ١٠٠ بريد صالح، دون بيانات إضافية.',
    };
  }
}
