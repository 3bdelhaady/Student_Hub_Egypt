'use server';
import { reportFailure } from '@/lib/diagnostics';
import { courseInStudentScope, studentCourseScopeSql } from '@/modules/agent-academic/queries';
import { z } from 'zod';
import { db } from '@/db';
import { requireStudentViewer } from '@/lib/session';
import { eq, and, inArray } from 'drizzle-orm';
import { type FormState, text, refresh, fail } from '../shared/form-state';
import {
  courses,
  user,
  resources,
  savedCourses,
  resourceProgress,
  assignmentSubmissions,
} from '@/db/schema';
import { canReadAcademic } from '@/lib/policy';
import { normalizeExternalUrl } from '../shared/url';

export async function submitAssignment(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const resourceId = String(form.get('resourceId') || '');
  const parsed = z
    .object({ body: text(10, 20000), url: z.string().trim().max(2200).optional() })
    .safeParse({ body: form.get('body'), url: form.get('url') || undefined });
  if (!parsed.success) return { error: 'اكتب إجابة من ١٠ أحرف على الأقل.' };
  const url = normalizeExternalUrl(parsed.data.url);
  if (parsed.data.url && !url) return { error: 'الرابط غير صالح، استخدم رابط https كاملًا.' };
  const [row] = await db
    .select({ universityId: courses.universityId, courseId: courses.id })
    .from(resources)
    .innerJoin(courses, eq(resources.courseId, courses.id))
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.kind, 'assignment'),
        eq(courses.published, true),
      ),
    )
    .limit(1);
  if (
    !row ||
    !canReadAcademic(v.membership, row.universityId) ||
    !(await courseInStudentScope(row.courseId, v.membership))
  )
    return fail();
  try {
    await db
      .insert(assignmentSubmissions)
      .values({
        id: crypto.randomUUID(),
        resourceId,
        userId: v.user.id,
        body: parsed.data.body,
        url,
      })
      .onConflictDoUpdate({
        target: [assignmentSubmissions.resourceId, assignmentSubmissions.userId],
        set: { body: parsed.data.body, url, updatedAt: new Date() },
      });
    refresh();
    return { success: 'سُجّلت إجابتك، يمكنك تحديثها في أي وقت.' };
  } catch {
    reportFailure('modules.learning.actions');
    return fail();
  }
}

export async function toggleSavedCourse(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const courseId = String(form.get('courseId') || '');
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.published, true)))
    .limit(1);
  if (!course || !(await courseInStudentScope(courseId, v.membership))) return fail();
  try {
    await db.transaction(async (tx) => {
      await tx.select({ id: user.id }).from(user).where(eq(user.id, v.user.id)).for('update');
      if (form.get('saved') === 'true')
        await tx
          .delete(savedCourses)
          .where(and(eq(savedCourses.userId, v.user.id), eq(savedCourses.courseId, courseId)));
      else
        await tx
          .insert(savedCourses)
          .values({ id: crypto.randomUUID(), userId: v.user.id, courseId })
          .onConflictDoNothing();
    });
    refresh();
    return {
      success:
        form.get('saved') === 'true'
          ? 'أزيل المقرر من المحفوظات.'
          : 'حُفظ المقرر في مساحتك الجامعية.',
    };
  } catch {
    reportFailure('modules.learning.actions');
    return fail();
  }
}

export async function toggleResourceProgress(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const resourceId = String(form.get('resourceId') || '');
  const [row] = await db
    .select({ universityId: courses.universityId, courseId: courses.id })
    .from(resources)
    .innerJoin(courses, eq(resources.courseId, courses.id))
    .where(and(eq(resources.id, resourceId), eq(courses.published, true)))
    .limit(1);
  if (
    !row ||
    !canReadAcademic(v.membership, row.universityId) ||
    !(await courseInStudentScope(row.courseId, v.membership))
  )
    return fail();
  try {
    if (form.get('completed') === 'true')
      await db
        .delete(resourceProgress)
        .where(
          and(eq(resourceProgress.userId, v.user.id), eq(resourceProgress.resourceId, resourceId)),
        );
    else
      await db
        .insert(resourceProgress)
        .values({ id: crypto.randomUUID(), userId: v.user.id, resourceId })
        .onConflictDoNothing();
    refresh();
    return {
      success:
        form.get('completed') === 'true'
          ? 'عُدّل تقدمك، يمكنك العودة للمورد لاحقًا.'
          : 'تم تسجيل إكمال المورد.',
    };
  } catch {
    reportFailure('modules.learning.actions');
    return fail();
  }
}

/** Replace only the owner's visible, published course list, with stale-tab protection. */
export async function saveCourseSelection(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const ids = z.array(z.string().min(1).max(150)).max(500);
  let selected: string[], previous: string[];
  try {
    selected = [...new Set(ids.parse(JSON.parse(String(form.get('courseIds') || '[]'))))].sort();
    previous = [...new Set(ids.parse(JSON.parse(String(form.get('previousIds') || '[]'))))].sort();
  } catch {
    reportFailure('modules.learning.actions');
    return { error: 'تعذر قراءة اختيار المقررات، أعد تحميل الصفحة وحاول مرة أخرى.' };
  }
  try {
    const result = await db.transaction(async (tx) => {
      // Lock the owner's account row so concurrent batch saves cannot both replace an old list.
      await tx.select({ id: user.id }).from(user).where(eq(user.id, v.user.id)).for('update');
      const published = await tx
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.published, true), studentCourseScopeSql(v.membership)));
      const valid = new Set(published.map((course) => course.id));
      if (selected.some((id) => !valid.has(id))) return 'invalid';
      const current = await tx
        .select({ id: savedCourses.courseId })
        .from(savedCourses)
        .innerJoin(courses, eq(savedCourses.courseId, courses.id))
        .where(
          and(
            eq(savedCourses.userId, v.user.id),
            eq(courses.published, true),
            studentCourseScopeSql(v.membership),
          ),
        );
      if (JSON.stringify(current.map((row) => row.id).sort()) !== JSON.stringify(previous))
        return 'stale';
      const visibleIds = published.map((course) => course.id);
      if (visibleIds.length)
        await tx
          .delete(savedCourses)
          .where(
            and(eq(savedCourses.userId, v.user.id), inArray(savedCourses.courseId, visibleIds)),
          );
      if (selected.length)
        await tx
          .insert(savedCourses)
          .values(
            selected.map((courseId) => ({ id: crypto.randomUUID(), userId: v.user.id, courseId })),
          );
      return 'saved';
    });
    if (result === 'invalid')
      return { error: 'أحد المقررات لم يعد متاحًا، أعد تحميل الصفحة قبل الحفظ.' };
    if (result === 'stale')
      return {
        error:
          'تغيّرت قائمتك في صفحة أخرى، أعد تحميل الصفحة لمراجعة القائمة الحالية قبل حفظ تغييراتك.',
      };
    refresh();
    return { success: 'حُفظت قائمة مقرراتك.' };
  } catch {
    reportFailure('modules.learning.actions');
    return fail();
  }
}
