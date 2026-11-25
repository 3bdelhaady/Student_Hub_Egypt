'use server';
import { reportFailure } from '@/lib/diagnostics';
import { db } from '@/db';
import {
  user,
  memberships,
  accountPreferences,
  institutionAgents,
  studentOrganizations,
  platformAdmins,
  institutionAuditEvents,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { canManageOfficers } from './policy';
import { activeEntryScope } from '../portal/queries';
import { agentSections } from './section-policy';
import { refresh, type FormState } from '../shared/form-state';
export async function assignFacultyOfficer(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  try {
    await db.transaction(async (tx) => {
      const [actor] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      const [org] = await tx
        .select()
        .from(studentOrganizations)
        .where(eq(studentOrganizations.id, String(form.get('organizationId') || '')))
        .for('share')
        .limit(1);
      if (
        !actor ||
        actor.department !== 'student_affairs' ||
        !org?.active ||
        !['student_union', 'student_activity'].includes(org.kind) ||
        !canManageOfficers(
          actor,
          { ...org, department: org.kind },
          await activeEntryScope(actor, tx),
        )
      )
        throw Error();
      const email = String(form.get('email') || '')
        .trim()
        .toLowerCase();
      if (!email || email.length > 254) throw Error();
      const [person] = await tx
        .select()
        .from(user)
        .where(eq(user.email, email))
        .for('update')
        .limit(1);
      if (!person || person.id === v.user.id) throw Error();
      const [admin] = await tx
        .select()
        .from(platformAdmins)
        .where(eq(platformAdmins.userId, person.id))
        .limit(1);
      const [old] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, person.id))
        .limit(1);
      const [membership] = await tx
        .select()
        .from(memberships)
        .where(eq(memberships.userId, person.id))
        .for('share')
        .limit(1);
      if (
        admin ||
        old ||
        !membership ||
        membership.role !== 'student' ||
        !['active', 'pending'].includes(membership.status) ||
        membership.universityId !== actor.universityId ||
        membership.facultyId !== actor.facultyId
      )
        throw Error();
      await tx.insert(institutionAgents).values({
        id: crypto.randomUUID(),
        userId: person.id,
        institutionId: actor.institutionId,
        universityId: actor.universityId,
        facultyId: actor.facultyId,
        organizationId: org.id,
        department: org.kind as 'student_union' | 'student_activity',
        position: 'member',
        status: 'active',
        canRead: true,
        canEdit: false,
        canPublish: false,
        sectionPermissions: Object.fromEntries(
          Object.keys(agentSections).map((k) => [
            k,
            { canRead: false, canEdit: false, canPublish: false },
          ]),
        ),
      });
      await tx
        .insert(accountPreferences)
        .values({ userId: person.id, activeMode: 'student' })
        .onConflictDoUpdate({
          target: accountPreferences.userId,
          set: { activeMode: 'student', updatedAt: new Date() },
        });
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: actor.institutionId,
        entityId: person.id,
        action: 'officer.activated-by-affairs',
      });
    });
    refresh();
    return {
      success:
        'تم تفعيل صلاحية Coordinator وإضافة بطاقته، يمكنه التبديل بين طالب و Coordinator من الملف الشخصي، دون موافقة أدمن المنصة.',
    };
  } catch {
    reportFailure('modules.institution.officer-assignment');
    return {
      error:
        'تعذرت الإضافة، تأكد من وجود حساب طالب غير موقوف من كليتك، وعدم وجود تعيين سابق، واختيار جهة مفعلة من كليتك.',
    };
  }
}
