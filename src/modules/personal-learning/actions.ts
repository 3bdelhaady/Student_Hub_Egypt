'use server';
import { reportFailure } from '@/lib/diagnostics';
import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import {
  personalLearningCourses as courses,
  personalLearningResources as resources,
} from '@/db/schema';
import { requireStudentViewer } from '@/lib/session';
import { type FormState, fail, refresh } from '@/modules/shared/form-state';
import { personalCourseInput, personalResourceInput } from './policy';
const idInput = z.string().min(1).max(150);
export async function createPersonalCourse(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer('/learning/new');
  const course = personalCourseInput.safeParse(Object.fromEntries(form));
  if (!course.success) return { error: 'راجع اسم الدورة والوصف وحالة الحفظ.' };
  let items: z.output<typeof personalResourceInput>[];
  try {
    items = z
      .array(personalResourceInput)
      .max(100)
      .parse(JSON.parse(String(form.get('resources') || '[]')));
  } catch {
    reportFailure('modules.personal-learning.actions');
    return {
      error:
        'أدخل اسمًا لكل مورد مع ملاحظة أو رابط HTTPS صحيح، الحد التقني 100 مورد في الإنشاء الواحد.',
    };
  }
  const id = crypto.randomUUID();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(courses).values({ id, userId: v.user.id, ...course.data });
      if (items.length)
        await tx.insert(resources).values(
          items.map((item, position) => ({
            ...item,
            id: crypto.randomUUID(),
            courseId: id,
            position,
          })),
        );
    });
  } catch {
    reportFailure('modules.personal-learning.actions');
    return fail();
  }
  refresh();
  redirect('/learning/' + id);
}
export async function updatePersonalCourse(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const id = idInput.safeParse(form.get('courseId'));
  const data = personalCourseInput.safeParse(Object.fromEntries(form));
  if (!id.success || !data.success) return fail();
  try {
    const rows = await db
      .update(courses)
      .set({ ...data.data, updatedAt: new Date() })
      .where(and(eq(courses.id, id.data), eq(courses.userId, v.user.id)))
      .returning({ id: courses.id });
    if (!rows.length) return fail();
    refresh();
    return { success: 'حُفظت تفاصيل دورتك الخاصة.' };
  } catch {
    reportFailure('modules.personal-learning.actions');
    return fail();
  }
}
export async function addPersonalResource(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const id = idInput.safeParse(form.get('courseId'));
  const data = personalResourceInput.safeParse(Object.fromEntries(form));
  const resourceId = form.get('resourceId') ? idInput.safeParse(form.get('resourceId')) : null;
  if (!id.success || !data.success || (resourceId && !resourceId.success))
    return { error: 'أدخل اسم المورد وملاحظة أو رابط HTTPS صحيحًا.' };
  try {
    await db.transaction(async (tx) => {
      const [owner] = await tx
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.id, id.data), eq(courses.userId, v.user.id)))
        .for('update')
        .limit(1);
      if (!owner) throw new Error('owner');
      const [last] = await tx
        .select({ position: sql<number>`coalesce(max(${resources.position}), -1)::int` })
        .from(resources)
        .where(eq(resources.courseId, owner.id));
      if (resourceId?.success) {
        const changed = await tx
          .update(resources)
          .set(data.data)
          .where(and(eq(resources.id, resourceId.data), eq(resources.courseId, owner.id)))
          .returning({ id: resources.id });
        if (!changed.length) throw new Error('resource');
      } else {
        await tx.insert(resources).values({
          ...data.data,
          id: crypto.randomUUID(),
          courseId: owner.id,
          position: last.position + 1,
        });
      }
      await tx.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, owner.id));
    });
    refresh();
    return { success: resourceId ? 'حُفظت تغييرات المورد.' : 'أُضيف المورد إلى دورتك الخاصة.' };
  } catch {
    reportFailure('modules.personal-learning.actions');
    return fail();
  }
}
export async function changePersonalResource(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const courseId = idInput.safeParse(form.get('courseId')),
    resourceId = idInput.safeParse(form.get('resourceId'));
  const operation = z.enum(['complete', 'undo', 'delete']).safeParse(form.get('operation'));
  if (!courseId.success || !resourceId.success || !operation.success) return fail();
  try {
    await db.transaction(async (tx) => {
      const [owner] = await tx
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.id, courseId.data), eq(courses.userId, v.user.id)))
        .for('update')
        .limit(1);
      if (!owner) throw new Error('owner');
      const predicate = and(eq(resources.id, resourceId.data), eq(resources.courseId, owner.id));
      const changed =
        operation.data === 'delete'
          ? await tx.delete(resources).where(predicate).returning({ id: resources.id })
          : await tx
              .update(resources)
              .set({ completedAt: operation.data === 'complete' ? new Date() : null })
              .where(predicate)
              .returning({ id: resources.id });
      if (!changed.length) throw new Error('resource');
      await tx.update(courses).set({ updatedAt: new Date() }).where(eq(courses.id, owner.id));
    });
    refresh();
    return { success: operation.data === 'delete' ? 'حُذف المورد من دورتك.' : 'حُدّث تقدمك الشخصي.' };
  } catch {
    reportFailure('modules.personal-learning.actions');
    return fail();
  }
}
export async function deletePersonalCourse(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const id = idInput.safeParse(form.get('courseId'));
  if (!id.success || form.get('confirm') !== 'on')
    return { error: 'أكد حذف هذه الدورة ومواردها أولًا.' };
  try {
    const rows = await db
      .delete(courses)
      .where(and(eq(courses.id, id.data), eq(courses.userId, v.user.id)))
      .returning({ id: courses.id });
    if (!rows.length) return fail();
  } catch {
    reportFailure('modules.personal-learning.actions');
    return fail();
  }
  refresh();
  redirect('/services');
}
