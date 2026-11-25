'use server';
import { reportFailure } from '@/lib/diagnostics';
import { ensureDefaultUnions } from '../institution/default-unions';
import { z } from 'zod';
import { db } from '@/db';
import { requireViewer } from '@/lib/session';
import { eq, and } from 'drizzle-orm';
import { type FormState, text, refresh, fail } from '../shared/form-state';
import { faculties, auditEvents } from '@/db/schema';
import { canManageMembers } from '@/lib/policy';

export async function saveFaculty(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (
    !v.platformAdmin ||
    !v.membership ||
    !canManageMembers(v.membership, v.membership.universityId)
  )
    return fail();
  const parsed = z
    .object({ id: z.string().max(100).optional(), name: text(2, 120) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'اكتب اسم كلية من حرفين إلى ١٢٠ حرفًا.' };
  const universityId = v.membership.universityId;
  const id = parsed.data.id || crypto.randomUUID();
  try {
    await db.transaction(async (tx) => {
      const data = { name: parsed.data.name, active: form.get('active') === 'on' };
      if (parsed.data.id) {
        const changed = await tx
          .update(faculties)
          .set(data)
          .where(and(eq(faculties.id, id), eq(faculties.universityId, universityId)))
          .returning({ id: faculties.id });
        if (!changed.length) throw new Error('not found');
      } else await tx.insert(faculties).values({ id, universityId, ...data });
      await ensureDefaultUnions(tx);
      await tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        universityId,
        action: 'faculty.saved',
        entityId: id,
      });
    });
    refresh();
    return {
      success:
        'تم حفظ الكلية، الكليات غير المتاحة لا تظهر للطلاب الجدد؛ العضويات السابقة لا تتغير.',
    };
  } catch {
    reportFailure('modules.catalog.actions');
    return { error: 'تعذر حفظ الكلية، قد يكون الاسم موجودًا بالفعل.' };
  }
}
