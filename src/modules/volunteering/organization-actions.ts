'use server';
import { reportFailure } from '@/lib/diagnostics';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  studentOrganizations,
  faculties,
  institutions,
  portalEntries,
  portalRequests,
} from '@/db/schema';
import { requireStudentViewer } from '@/lib/session';
import { volunteerOrganizationInScope } from './policy';
import { refresh, type FormState } from '../shared/form-state';
export async function applyToVolunteerOrganization(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const v = await requireStudentViewer();
  const p = z
    .object({
      organizationId: z.string().min(1).max(150),
      notes: z.string().trim().max(3000).default(''),
      applicationConsent: z.literal('on'),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'راجع الجهة والملاحظات والموافقة على إرسال الطلب.' };
  try {
    await db.transaction(async (tx) => {
      if (v.membership?.status !== 'active') throw Error('membership');
      const [r] = await tx
        .select({ o: studentOrganizations })
        .from(studentOrganizations)
        .innerJoin(institutions, eq(institutions.id, studentOrganizations.institutionId))
        .innerJoin(faculties, eq(faculties.id, studentOrganizations.facultyId))
        .where(
          and(
            eq(studentOrganizations.id, p.data.organizationId),
            eq(studentOrganizations.universityId, v.membership.universityId),
            eq(studentOrganizations.active, true),
            eq(institutions.active, true),
            eq(faculties.active, true),
          ),
        )
        .limit(1);
      if (!r || !volunteerOrganizationInScope(v.membership, r.o)) throw Error('scope');
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
      if (recent.length >= 10) throw Error('rate');
      await tx.execute(sql`select id from student_organizations where id=${r.o.id} for update`);
      const entryId = 'volunteer-org-' + r.o.id;
      await tx
        .insert(portalEntries)
        .values({
          id: entryId,
          institutionId: r.o.institutionId,
          universityId: r.o.universityId,
          facultyId: r.o.facultyId,
          organizationId: r.o.id,
          department: r.o.kind,
          kind: 'volunteer',
          title: r.o.name,
          description: 'طلبات التطوع متاحة طوال العام.',
          category: 'تطوع على مدار العام',
          published: false,
          authorId: v.user.id,
        })
        .onConflictDoNothing();
      const [existing] = await tx
        .select({ id: portalRequests.id })
        .from(portalRequests)
        .where(
          and(
            eq(portalRequests.userId, v.user.id),
            eq(portalRequests.entryId, entryId),
            inArray(portalRequests.status, ['pending', 'reviewing', 'accepted']),
          ),
        )
        .limit(1);
      if (existing) throw Error('duplicate');
      await tx.insert(portalRequests).values({
        id: crypto.randomUUID(),
        userId: v.user.id,
        entryId,
        kind: 'volunteer',
        subject: r.o.name,
        body: 'طلب تطوع مباشر إلى الجهة.' + (p.data.notes ? '\n\n' + p.data.notes : ''),
        reference: 'SH-' + crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase(),
      });
    });
    refresh();
    return { success: 'تم استلام طلب التطوع، يمكنك متابعته من صفحة طلباتي.' };
  } catch {
    reportFailure('modules.volunteering.organization-actions');
    return { error: 'تعذر إرسال الطلب، تحقق من العضوية والجهة وعدم وجود طلب قائم.' };
  }
}
