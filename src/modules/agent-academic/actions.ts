'use server';
import { reportFailure } from '@/lib/diagnostics';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import {
  courses,
  resources,
  agentCourseScopes,
  institutionAuditEvents,
  studentOrganizations,
} from '@/db/schema';
import { requireViewer } from '@/lib/session';
import { type FormState, refresh, fail } from '@/modules/shared/form-state';
import { normalizeExternalUrl } from '@/modules/shared/url';
import { cairoDate } from '@/modules/shared/datetime';
import { resolveScope } from '@/modules/institution/service';
import { academicActor, canUseAgentCourse } from './queries';
const courseInput = z.object({
  id: z.string().max(100).default(''),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(2000),
  code: z.string().trim().min(1).max(80),
  category: z.string().trim().min(2).max(80),
  instructor: z.string().trim().min(2).max(100),
});
export async function saveAgentCourse(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer(),
    p = courseInput.safeParse(Object.fromEntries(form));
  if (!p.success) return fail();
  try {
    await db.transaction(async (tx) => {
      const actor = await academicActor(v, tx);
      if (!actor || actor.department !== 'student_affairs') throw Error('course data affairs only');
      const { id, ...data } = p.data;
      let scope;
      if (id) {
        scope = (
          await tx
            .select()
            .from(agentCourseScopes)
            .where(eq(agentCourseScopes.courseId, id))
            .limit(1)
        )[0];
      } else {
        const a = await academicActor(v, tx);
        if (!a || !a.universityId || !a.facultyId || a.department !== 'student_affairs')
          throw Error('scope');
        const [organization] = await tx
          .select()
          .from(studentOrganizations)
          .where(
            and(
              eq(studentOrganizations.institutionId, a.institutionId),
              eq(studentOrganizations.universityId, a.universityId),
              eq(studentOrganizations.facultyId, a.facultyId),
              eq(studentOrganizations.kind, 'student_union'),
            ),
          )
          .limit(1);
        if (!organization) throw Error('faculty union missing');
        const resolved = await resolveScope(tx, {
          ...a,
          department: 'student_union',
          facultyId: a.facultyId,
          organizationId: organization.id,
        });
        scope = {
          ...resolved.scope,
          universityId: a.universityId,
          facultyId: a.facultyId,
          organizationId: organization.id,
          courseId: crypto.randomUUID(),
        };
      }
      if (!scope || !(await canUseAgentCourse(v, scope, 'canEdit', tx))) throw Error('permission');
      const [old] = id
        ? await tx.select().from(courses).where(eq(courses.id, id)).for('update').limit(1)
        : [];
      if (id && !old) throw Error('missing');
      const published = form.get('published') === 'on';
      if ((published || old?.published) && !(await canUseAgentCourse(v, scope, 'canPublish', tx)))
        throw Error('publish');
      if (id)
        await tx
          .update(courses)
          .set({ ...data, published })
          .where(eq(courses.id, id));
      else {
        await tx
          .insert(courses)
          .values({ id: scope.courseId, universityId: scope.universityId, ...data, published });
        await tx.insert(agentCourseScopes).values(scope);
      }
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: scope.institutionId,
        action: id ? 'academic.course.updated' : 'academic.course.created',
        entityId: scope.courseId,
      });
    });
    refresh();
    return { success: 'تم حفظ المقرر في مساحة الجهة والكلية المحددة.' };
  } catch {
    reportFailure('modules.agent-academic.actions');
    return fail();
  }
}
const resourceInput = z.object({
  id: z.string().max(100).default(''),
  courseId: z.string().min(1).max(100),
  title: z.string().trim().min(2).max(180),
  kind: z.enum(['lecture', 'file', 'section', 'assignment', 'video']),
  body: z.string().trim().max(30000),
  url: z.string().trim().max(2200).default(''),
  dueAt: z.string().max(40).default(''),
  position: z.coerce.number().int().min(0).max(1000),
});
export async function saveAgentResource(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer(),
    p = resourceInput.safeParse(Object.fromEntries(form));
  if (!p.success) return fail();
  try {
    const { id, url: rawUrl, dueAt: rawDue, ...data } = p.data,
      url = normalizeExternalUrl(rawUrl),
      dueAt = rawDue ? cairoDate(rawDue) : null;
    if (
      (rawUrl && !url) ||
      (data.kind === 'video' && !url) ||
      (data.kind === 'section' && (url || data.body.length > 2000)) ||
      (data.kind !== 'section' && data.body.length < 10) ||
      (rawDue && data.kind !== 'assignment')
    )
      throw Error('invalid');
    await db.transaction(async (tx) => {
      const [scope] = await tx
        .select()
        .from(agentCourseScopes)
        .where(eq(agentCourseScopes.courseId, data.courseId))
        .limit(1);
      if (!scope || !(await canUseAgentCourse(v, scope, 'canEdit', tx))) throw Error('permission');
      const [course] = await tx
        .select()
        .from(courses)
        .where(eq(courses.id, data.courseId))
        .for('update')
        .limit(1);
      if (!course || (course.published && !(await canUseAgentCourse(v, scope, 'canPublish', tx))))
        throw Error('publish');
      if (id) {
        const [old] = await tx
          .select()
          .from(resources)
          .where(and(eq(resources.id, id), eq(resources.courseId, data.courseId)))
          .limit(1);
        if (!old) throw Error('scope');
        await tx
          .update(resources)
          .set({ ...data, url, dueAt })
          .where(eq(resources.id, id));
      } else await tx.insert(resources).values({ id: crypto.randomUUID(), ...data, url, dueAt });
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: scope.institutionId,
        action: 'academic.resource.saved',
        entityId: data.courseId,
      });
    });
    refresh();
    return { success: 'تم حفظ المورد في المقرر المحدد.' };
  } catch {
    reportFailure('modules.agent-academic.actions');
    return fail();
  }
}
export async function deleteAgentResource(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (form.get('deleteConsent') !== 'on') return fail();
  try {
    await db.transaction(async (tx) => {
      const courseId = String(form.get('courseId') || ''),
        id = String(form.get('id') || '');
      const [scope] = await tx
        .select()
        .from(agentCourseScopes)
        .where(eq(agentCourseScopes.courseId, courseId))
        .limit(1);
      if (!scope || !(await canUseAgentCourse(v, scope, 'canEdit', tx))) throw Error('permission');
      const [course] = await tx
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .for('update')
        .limit(1);
      if (!course || (course.published && !(await canUseAgentCourse(v, scope, 'canPublish', tx))))
        throw Error('publish');
      const changed = await tx
        .delete(resources)
        .where(and(eq(resources.id, id), eq(resources.courseId, courseId)))
        .returning({ id: resources.id });
      if (!changed.length) throw Error('scope');
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: scope.institutionId,
        action: 'academic.resource.deleted',
        entityId: id,
      });
    });
  } catch {
    reportFailure('modules.agent-academic.actions');
    return fail();
  }
  refresh();
  redirect('/manage/academic?course=' + encodeURIComponent(String(form.get('courseId') || '')));
}
