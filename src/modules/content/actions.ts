'use server';
import { reportFailure } from '@/lib/diagnostics';
import { postCategories, categoryOptions } from './options';
import { z } from 'zod';
import { cairoDate } from '../shared/datetime';
import { db } from '@/db';
import { requireViewer } from '@/lib/session';
import { eq, and } from 'drizzle-orm';
import { type FormState, text, refresh, fail } from '../shared/form-state';
import { normalizeExternalUrl } from '../shared/url';
import { courses, posts, resources, auditEvents, agentCourseScopes } from '@/db/schema';
import { canManageContent } from '@/lib/policy';

export async function saveCourse(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (!v.membership || !canManageContent(v.membership, v.membership.universityId)) return fail();
  const parsed = z
    .object({
      id: z.string().max(100).optional(),
      title: text(2, 160),
      description: text(10, 2000),
      code: text(1, 80),
      category: text(2, 80),
      instructor: text(2, 100),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'راجع طول الحقول، الوصف ١٠ أحرف على الأقل، والعنوان حرفان على الأقل.' };
  const { id, ...data } = parsed.data;
  const entityId = id || crypto.randomUUID();
  const universityId = v.membership.universityId;
  try {
    await db.transaction(async (tx) => {
      if (
        id &&
        !v.platformAdmin &&
        (
          await tx
            .select()
            .from(agentCourseScopes)
            .where(eq(agentCourseScopes.courseId, id))
            .limit(1)
        ).length
      )
        throw Error('scoped course');
      if (id) {
        const changed = await tx
          .update(courses)
          .set({ ...data, published: form.get('published') === 'on' })
          .where(and(eq(courses.id, id), eq(courses.universityId, universityId)))
          .returning({ id: courses.id });
        if (!changed.length) throw new Error('not found');
      } else
        await tx.insert(courses).values({
          id: entityId,
          universityId,
          ...data,
          published: form.get('published') === 'on',
        });
      await tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        universityId,
        action: id ? 'course.updated' : 'course.created',
        entityId,
      });
    });
    refresh();
    return { success: 'تم حفظ المقرر.' };
  } catch {
    reportFailure('modules.content.actions');
    return fail();
  }
}

export async function savePost(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (!v.membership || !canManageContent(v.membership, v.membership.universityId)) return fail();
  const parsed = z
    .object({
      id: z.string().max(100).optional(),
      title: text(2, 160),
      excerpt: text(10, 400),
      body: text(20, 20000),
      category: text(2, 80),
      kind: z.enum(['news', 'opportunity']),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'راجع الحقول: المقدمة ١٠ أحرف والمحتوى ٢٠ حرفًا على الأقل.' };
  const existingCategories = await db
    .selectDistinct({ category: posts.category })
    .from(posts)
    .where(eq(posts.universityId, v.membership.universityId));
  if (
    !categoryOptions(
      postCategories,
      existingCategories.map((r) => r.category),
    ).includes(parsed.data.category)
  )
    return { error: 'اختر تصنيفًا من القائمة المتاحة.' };
  const { id, ...data } = parsed.data;
  const entityId = id || crypto.randomUUID();
  const universityId = v.membership.universityId;
  try {
    await db.transaction(async (tx) => {
      if (id) {
        const changed = await tx
          .update(posts)
          .set({ ...data, published: form.get('published') === 'on' })
          .where(and(eq(posts.id, id), eq(posts.universityId, universityId)))
          .returning({ id: posts.id });
        if (!changed.length) throw new Error('not found');
      } else
        await tx.insert(posts).values({
          id: entityId,
          universityId,
          ...data,
          published: form.get('published') === 'on',
        });
      await tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        universityId,
        action: id ? 'post.updated' : 'post.created',
        entityId,
      });
    });
    refresh();
    return { success: 'تم حفظ المحتوى.' };
  } catch {
    reportFailure('modules.content.actions');
    return fail();
  }
}

const resourceKinds = ['lecture', 'file', 'section', 'assignment', 'video'] as const;

export async function saveResource(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (!v.membership || !canManageContent(v.membership, v.membership.universityId)) return fail();
  const parsed = z
    .object({
      id: z.string().max(100).optional(),
      courseId: text(1, 100),
      title: text(2, 180),
      kind: z.enum(resourceKinds),
      body: z.string().trim().max(30000),
      url: z.string().trim().max(2200).optional(),
      dueAt: z.string().trim().max(40).optional(),
      position: z.coerce.number().int().min(0).max(1000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'راجع الحقول، الترتيب من ٠ إلى ١٠٠٠ والمحتوى حتى ٣٠٠٠٠ حرف.' };
  const { id, url: rawUrl, dueAt: rawDue, ...rest } = parsed.data;
  if (rest.kind === 'section' ? rest.body.length > 2000 : rest.body.length < 10)
    return {
      error:
        rest.kind === 'section' ? 'وصف القسم حتى ٢٠٠٠ حرف.' : 'المحتوى التعليمي ١٠ أحرف على الأقل.',
    };
  const url = normalizeExternalUrl(rawUrl);
  if (rawUrl && !url) return { error: 'الرابط غير صالح، استخدم رابط https كاملًا على موقع معروف.' };
  if (rest.kind === 'video' && !url)
    return { error: 'أضف رابط https للفيديو، مثل رابط المحاضرة المسجلة.' };
  if (rest.kind === 'section' && url) return { error: 'الأقسام تنظّم المحتوى ولا تحمل روابط.' };
  if (rawDue && rest.kind !== 'assignment') return { error: 'موعد التسليم متاح للواجبات فقط.' };
  let dueAt: Date | null = null;
  if (rawDue) {
    try {
      dueAt = cairoDate(rawDue);
    } catch {
      reportFailure('modules.content.actions');
      return { error: 'موعد التسليم غير صالح بتوقيت القاهرة.' };
    }
  }
  const data = { ...rest, url, dueAt };
  const entityId = id || crypto.randomUUID();
  const universityId = v.membership.universityId;
  try {
    await db.transaction(async (tx) => {
      const [parent] = await tx
        .select()
        .from(courses)
        .where(and(eq(courses.id, data.courseId), eq(courses.universityId, universityId)))
        .limit(1);
      if (!parent) throw new Error('forbidden');
      if (
        !v.platformAdmin &&
        (
          await tx
            .select()
            .from(agentCourseScopes)
            .where(eq(agentCourseScopes.courseId, parent.id))
            .limit(1)
        ).length
      )
        throw Error('scoped course');
      if (id) {
        const [existing] = await tx
          .select({ id: resources.id, courseId: resources.courseId })
          .from(resources)
          .innerJoin(courses, eq(resources.courseId, courses.id))
          .where(and(eq(resources.id, id), eq(courses.universityId, universityId)))
          .limit(1);
        if (!existing) throw new Error('forbidden');
        if (
          !v.platformAdmin &&
          (
            await tx
              .select()
              .from(agentCourseScopes)
              .where(eq(agentCourseScopes.courseId, existing.courseId))
              .limit(1)
          ).length
        )
          throw Error('scoped resource');
        await tx.update(resources).set(data).where(eq(resources.id, id));
      } else await tx.insert(resources).values({ id: entityId, ...data });
      await tx.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        universityId,
        action: id ? 'resource.updated' : 'resource.created',
        entityId,
      });
    });
    refresh();
    return {
      success: 'تم حفظ المورد، الروابط الخارجية تُفتح في تبويب جديد وتبقى من مسؤولية ناشرها.',
    };
  } catch {
    reportFailure('modules.content.actions');
    return fail();
  }
}
