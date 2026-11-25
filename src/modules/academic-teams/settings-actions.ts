'use server';
import { reportFailure } from '@/lib/diagnostics';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { courses, teamCourseSettings, institutionAuditEvents } from '@/db/schema';
import { requireViewer } from '@/lib/session';
import { academicActor, courseInStudentScope } from '@/modules/agent-academic/queries';
import { activeEntryScope } from '@/modules/portal/queries';
import { hasSectionRight } from '@/modules/institution/section-policy';
import { type FormState, refresh } from '@/modules/shared/form-state';
export async function saveTeamCourseSettings(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const p = z
    .object({
      courseId: z.string().min(1).max(100),
      maxMembers: z.coerce.number().int().min(2).max(100),
      conditions: z.string().trim().max(3000),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'راجع المقرر والحد الأقصى والشروط.' };
  try {
    await db.transaction(async (tx) => {
      const a = await academicActor(v, tx);
      if (
        !a ||
        a.department !== 'student_union' ||
        a.status !== 'active' ||
        !a.facultyId ||
        !a.universityId ||
        !hasSectionRight(a, 'team', 'canEdit') ||
        !(await activeEntryScope(a, tx))
      )
        throw Error('permission');
      // Lock the course while resolving and creating its faculty settings.
      const [c] = await tx
        .select()
        .from(courses)
        .where(eq(courses.id, p.data.courseId))
        .for('update')
        .limit(1);
      if (
        !c?.published ||
        c.universityId !== a.universityId ||
        !(await courseInStudentScope(
          c.id,
          { status: 'active', universityId: a.universityId, facultyId: a.facultyId },
          tx,
        ))
      )
        throw Error('course');
      const [old] = await tx
        .select()
        .from(teamCourseSettings)
        .where(
          and(eq(teamCourseSettings.courseId, c.id), eq(teamCourseSettings.facultyId, a.facultyId)),
        )
        .for('update')
        .limit(1);
      if (old && old.institutionId !== a.institutionId) throw Error('scope');
      const data = {
        enabled: form.get('enabled') === 'on',
        approvalRequired: form.get('approvalRequired') === 'on',
        maxMembers: p.data.maxMembers,
        conditions: p.data.conditions,
        updatedBy: v.user.id,
        updatedAt: new Date(),
      };
      await tx
        .insert(teamCourseSettings)
        .values({
          ...data,
          courseId: c.id,
          facultyId: a.facultyId,
          institutionId: a.institutionId,
          universityId: a.universityId,
        })
        .onConflictDoUpdate({
          target: [teamCourseSettings.courseId, teamCourseSettings.facultyId],
          set: data,
        });
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: a.institutionId,
        action: 'teams.course.settings',
        entityId: c.id,
      });
    });
    refresh();
    return { success: 'تم حفظ إتاحة الفرق وشروط المقرر، دون تغيير الفرق القائمة.' };
  } catch {
    reportFailure('modules.academic-teams.settings-actions');
    return { error: 'تعذر الحفظ، تحقق من صلاحية الفرق الأكاديمية ونطاق المقرر.' };
  }
}
