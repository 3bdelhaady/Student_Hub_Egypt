'use server';
import { reportFailure } from '@/lib/diagnostics';
import { courseInStudentScope } from '@/modules/agent-academic/queries';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import {
  academicTeamMembers,
  academicTeamProposals,
  portalEntries,
  studentOrganizations,
  courses,
  memberships,
  portalNotifications,
  portalRequests,
  user,
} from '@/db/schema';
import { requireStudentViewer } from '@/lib/session';
import { type FormState, refresh } from '@/modules/shared/form-state';
import { allocateTeamMarker } from './settings';
import { canProposeTeam, teamCreationInput } from './policy';
export async function proposeAcademicTeam(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer('/services/new-team');
  const parsed = teamCreationInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'راجع اسم الفريق ووصفه، واختر مقررًا مفعّلًا للفرق.' };
  const id = crypto.randomUUID();
  try {
    await db.transaction(async (tx) => {
      // Serialize this owner's proposals so duplicate/rate checks survive concurrent submissions.
      await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, v.user.id))
        .for('update')
        .limit(1);
      const [membership] = await tx
        .select()
        .from(memberships)
        .where(eq(memberships.userId, v.user.id))
        .for('share')
        .limit(1);
      const [course] = await tx
        .select()
        .from(courses)
        .where(eq(courses.id, parsed.data.courseId))
        .for('share')
        .limit(1);
      if (
        !course ||
        !canProposeTeam(membership, course) ||
        !(await courseInStudentScope(course.id, membership, tx))
      )
        throw new Error('scope');
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
      const duplicate = await tx
        .select({ id: portalRequests.id })
        .from(portalRequests)
        .innerJoin(academicTeamProposals, eq(academicTeamProposals.requestId, portalRequests.id))
        .where(
          and(
            eq(portalRequests.userId, v.user.id),
            eq(academicTeamProposals.courseId, course.id),
            inArray(portalRequests.status, ['pending', 'reviewing', 'accepted']),
            sql`lower(${portalRequests.subject}) = lower(${parsed.data.title})`,
          ),
        )
        .limit(1);
      if (duplicate.length) throw new Error('duplicate');
      if (!membership?.facultyId) throw Error('faculty');
      const setting = await allocateTeamMarker(tx, course.id, membership.facultyId);
      const [organization] = await tx
        .select()
        .from(studentOrganizations)
        .where(
          and(
            eq(studentOrganizations.institutionId, setting.institutionId),
            eq(studentOrganizations.facultyId, membership.facultyId),
            eq(studentOrganizations.kind, 'student_union'),
            eq(studentOrganizations.active, true),
          ),
        )
        .limit(1);
      if (!organization) throw Error('union unavailable');
      const entryId = crypto.randomUUID();
      await tx.insert(portalEntries).values({
        id: entryId,
        institutionId: setting.institutionId,
        universityId: course.universityId,
        facultyId: membership.facultyId,
        organizationId: organization.id,
        department: 'student_union',
        kind: 'team',
        title: parsed.data.title,
        description: parsed.data.description,
        teamCourseId: course.id,
        teamMarker: setting.marker,
        capacity: setting.maxMembers - 1,
        published: !setting.approvalRequired,
        authorId: v.user.id,
      });
      if (!setting.approvalRequired)
        await tx.insert(academicTeamMembers).values({ entryId, userId: v.user.id, role: 'leader' });
      const reference = 'SH-' + crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
      await tx.insert(portalRequests).values({
        id,
        userId: v.user.id,
        entryId,
        status: setting.approvalRequired ? 'pending' : 'accepted',
        kind: 'team_creation',
        subject: parsed.data.title,
        body:
          parsed.data.description +
          '\n\nالحد الأقصى لأعضاء الفريق: ' +
          setting.maxMembers +
          '\nشروط المقرر: ' +
          (setting.conditions || 'لا توجد شروط إضافية'),
        quantity: 1,
        unitPriceMinor: 0,
        reference,
      });
      await tx.insert(academicTeamProposals).values({
        requestId: id,
        courseId: course.id,
        universityId: course.universityId,
        courseTitle: course.title,
        marker: setting.marker,
      });
      await tx.insert(portalNotifications).values({
        id: crypto.randomUUID(),
        userId: v.user.id,
        title: 'تم استلام طلب إنشاء الفريق',
        body: reference,
        href: '/requests/' + id,
      });
    });
  } catch {
    reportFailure('modules.academic-teams.actions');
    return {
      error:
        'تعذر إرسال الطلب، تأكد من تفعيل عضويتك وتوفر المقرر في جامعتك وعدم وجود طلب قائم بالاسم نفسه، يمكنك مراجعة طلباتك قبل المحاولة مجددًا.',
    };
  }
  refresh();
  redirect('/services?kind=team&course=' + encodeURIComponent(parsed.data.courseId));
}
