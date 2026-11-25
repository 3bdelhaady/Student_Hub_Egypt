'use server';
import { reportFailure } from '@/lib/diagnostics';
import { socialMediaSignature } from '../social/media';
import { institutionRestaurantDefaults } from './restaurant-info';
import { restaurantInput } from '../portal/restaurants';
import { governorates } from './governorates';
import { ensureDefaultUnions } from './default-unions';
import { z } from 'zod';
import { hashPassword } from 'better-auth/crypto';
import { db } from '@/db';
import {
  institutions,
  portalEntries,
  institutionAgents,
  institutionAuditEvents,
  platformAdmins,
  memberships,
  auditEvents,
  user,
  account,
  universities,
  studentOrganizations,
  institutionContent,
} from '@/db/schema';
import { requireViewer } from '@/lib/session';
import { eq, and, inArray } from 'drizzle-orm';
import { type FormState, text, refresh, fail } from '../shared/form-state';
import {
  canEditInstitution,
  canManageOfficers,
  canManageAgents,
  canEditDomain,
  type Department,
} from './policy';
import { resolveScope, type Tx } from './service';
import {
  parseSectionPermissions,
  validSectionPermissions,
  aggregateSectionPermissions,
  hasSectionRight,
} from './section-policy';
const department = z.enum([
  'student_affairs',
  'youth_welfare',
  'private_sector',
  'student_union',
  'student_activity',
]);
const scopeInput = z.object({
  institutionId: text(1, 100),
  facultyId: z.string().max(100).optional(),
  organizationId: z.string().max(100).optional(),
  department,
});
const position = z.enum(['representative', 'president', 'vice_president', 'member']);
async function audit(
  tx: Tx,
  actorId: string,
  institutionId: string,
  action: string,
  entityId: string,
) {
  await tx
    .insert(institutionAuditEvents)
    .values({ id: crypto.randomUUID(), actorId, institutionId, action, entityId });
}
const permissionFlags = (form: FormData) =>
  form.get('isSuperAgent') === 'on'
    ? { canRead: true, canEdit: true, canPublish: true }
    : {
        canRead: form.get('canRead') === 'on',
        canEdit: form.get('canEdit') === 'on',
        canPublish: form.get('canPublish') === 'on',
      };
function validFlags(flags: ReturnType<typeof permissionFlags>) {
  return (
    (!flags.canEdit || flags.canRead) && (!flags.canPublish || (flags.canRead && flags.canEdit))
  );
}
function validPosition(dept: string, pos: string) {
  return ['student_union', 'student_activity'].includes(dept)
    ? ['president', 'vice_president', 'member'].includes(pos)
    : pos === 'representative';
}
export async function saveInstitution(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const parsed = z
    .object({
      id: z.string().max(100).optional(),
      name: text(2, 160),
      kind: z.enum(['university', 'private_sector']),
      universityId: z.string().max(100).optional(),
      category: z.enum(['general', 'restaurant']).default('general'),
      governorate: z.union([z.literal(''), z.enum(governorates)]).default(''),
      description: z.string().trim().max(2000),
      website: z.union([z.literal(''), z.url({ protocol: /^https?$/ })]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'راجع بيانات المؤسسة والرابط، واختر نوع المؤسسة وجامعتها عند الحاجة.' };
  const { id, ...input } = parsed.data;
  try {
    await db.transaction(async (tx) => {
      const [existing] = id
        ? await tx.select().from(institutions).where(eq(institutions.id, id)).for('update').limit(1)
        : [];
      if (id && (!existing || existing.deletedAt)) throw new Error('not found');
      const [actor] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (
        !v.platformAdmin &&
        (!existing || !canEditInstitution(actor, existing.id, existing.active))
      )
        throw new Error('forbidden');
      const kind = existing?.kind || input.kind;
      const universityId =
        existing?.universityId || (kind === 'university' ? input.universityId || null : null);
      const category = v.platformAdmin
        ? kind === 'university'
          ? 'general'
          : input.category
        : existing!.category;
      const governorate = v.platformAdmin ? input.governorate : existing!.governorate;
      if ((kind === 'university' || category === 'restaurant') && !governorate)
        throw Error('governorate required');
      if (kind === 'university') {
        const [university] = universityId
          ? await tx.select().from(universities).where(eq(universities.id, universityId)).limit(1)
          : [];
        if (!university) throw new Error('university required');
        if (v.platformAdmin)
          await tx
            .update(universities)
            .set({ governorate })
            .where(eq(universities.id, university.id));
      }
      const entityId = existing?.id || crypto.randomUUID();
      let restaurantInfo = existing?.restaurantInfo;
      if (
        v.platformAdmin &&
        kind === 'private_sector' &&
        category === 'restaurant' &&
        form.get('restaurantInfoPresent') === '1'
      ) {
        const [legacy] = existing
          ? await tx
              .select()
              .from(portalEntries)
              .where(
                and(
                  eq(portalEntries.institutionId, existing.id),
                  eq(portalEntries.kind, 'restaurant'),
                ),
              )
              .limit(1)
          : [];
        const old = institutionRestaurantDefaults(existing?.restaurantInfo, legacy);
        const r = restaurantInput.parse({
          opensAt: form.get('opensAt') || '',
          closesAt: form.get('closesAt') || '',
          phone: form.get('phone') || '',
          delivery: form.get('delivery') || '',
          mapUrl: form.get('mapUrl') || '',
        });
        if (Boolean(r.opensAt) !== Boolean(r.closesAt)) throw Error('paired times required');
        restaurantInfo = {
          ...old,
          opensAt: r.opensAt,
          closesAt: r.closesAt,
          phone: r.phone,
          delivery: r.delivery,
          mapUrl: r.mapUrl,
          location: z
            .string()
            .trim()
            .max(300)
            .parse(form.get('location') || ''),
        };
        for (const key of ['logo', 'cover'] as const) {
          if (form.get('remove' + key) === 'on') restaurantInfo[key] = '';
          const file = form.get(key);
          if (file instanceof File && file.size) {
            if (
              file.size > 600 * 1024 ||
              !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
            )
              throw Error('invalid image');
            const bytes = Buffer.from(await file.arrayBuffer());
            if (!socialMediaSignature(file.type, bytes)) throw Error('invalid image');
            restaurantInfo[key] = `data:${file.type};base64,${bytes.toString('base64')}`;
          }
        }
      }
      const data = {
        restaurantInfo,
        name: input.name,
        category,
        governorate,
        kind,
        universityId,
        description: input.description,
        website: input.website,
        updatedAt: new Date(),
      };
      if (existing)
        await tx
          .update(institutions)
          .set({ ...data, active: v.platformAdmin ? form.get('active') === 'on' : existing.active })
          .where(eq(institutions.id, entityId));
      else
        await tx.insert(institutions).values({
          id: entityId,
          ...data,
          active: form.get('active') === 'on',
          demo: form.get('demo') === 'on',
        });
      if (existing && v.platformAdmin && form.get('active') !== 'on')
        await tx
          .update(institutionAgents)
          .set({ status: 'suspended', updatedAt: new Date() })
          .where(eq(institutionAgents.institutionId, entityId));
      await ensureDefaultUnions(tx);
      await audit(
        tx,
        v.user.id,
        entityId,
        existing ? 'institution.updated' : 'institution.created',
        entityId,
      );
    });
    refresh();
    return { success: 'تم حفظ المؤسسة، الإنشاء لا يمنح أي حساب صلاحيات تلقائيًا.' };
  } catch {
    reportFailure('modules.institution.actions');
    return fail();
  }
}
export async function saveStudentOrganization(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const parsed = z
    .object({
      id: z.string().max(100).optional(),
      institutionId: text(1, 100),
      facultyId: text(1, 100),
      kind: z.enum(['student_union', 'student_activity']),
      name: text(2, 160),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success || parsed.data.kind !== 'student_activity')
    return { error: 'اتحاد الطلاب موجود افتراضيًا لكل كلية، يمكن إضافة الأنشطة الطلابية فقط.' };
  try {
    await db.transaction(async (tx) => {
      const { id, name, kind, ...scope } = parsed.data;
      const { institution, scope: resolved } = await resolveScope(tx, {
        ...scope,
        department: 'student_affairs',
      });
      const [actor] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (
        !v.platformAdmin &&
        !canManageOfficers(actor, { ...resolved, department: kind }, institution.active)
      )
        throw new Error('forbidden');
      const [existing] = id
        ? await tx
            .select()
            .from(studentOrganizations)
            .where(eq(studentOrganizations.id, id))
            .for('update')
            .limit(1)
        : [];
      if (
        id &&
        (!existing ||
          existing.institutionId !== resolved.institutionId ||
          existing.facultyId !== resolved.facultyId ||
          existing.kind !== kind)
      )
        throw new Error('scope mismatch');
      const entityId = id || crypto.randomUUID();
      const data = { name, active: form.get('active') === 'on' };
      if (existing)
        await tx
          .update(studentOrganizations)
          .set(data)
          .where(eq(studentOrganizations.id, entityId));
      else
        await tx.insert(studentOrganizations).values({
          id: entityId,
          institutionId: resolved.institutionId,
          universityId: resolved.universityId!,
          facultyId: resolved.facultyId!,
          kind,
          ...data,
        });
      await audit(
        tx,
        v.user.id,
        institution.id,
        existing ? 'organization.updated' : 'organization.created',
        entityId,
      );
    });
    refresh();
    return { success: 'تم حفظ الاتحاد أو النشاط ضمن نطاق الكلية.' };
  } catch {
    reportFailure('modules.institution.actions');
    return fail();
  }
}
export async function addInstitutionAgent(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const parsed = scopeInput
    .extend({ email: z.email().toLowerCase(), position })
    .safeParse(Object.fromEntries(form));
  const sections = parseSectionPermissions(form);
  const flags = sections ? aggregateSectionPermissions(sections) : permissionFlags(form);
  if (
    !parsed.success ||
    !validSectionPermissions(sections) ||
    (sections &&
      !['student_union', 'student_activity', 'private_sector'].includes(parsed.data.department)) ||
    (!sections && ['student_union', 'student_activity'].includes(parsed.data.department)) ||
    !validFlags(flags) ||
    !validPosition(parsed.data.department, parsed.data.position)
  )
    return { error: 'راجع النطاق والمنصب والصلاحيات، النشر يحتاج قراءة وتعديل.' };
  if (['student_union', 'student_activity'].includes(parsed.data.department))
    return { error: 'صلاحية Coordinator تُمنح لحساب طالب مسجل من خلال شؤون الطلاب في كليته فقط.' };
  const creating = form.get('createAccount') === 'on';
  const credentials = z
    .object({
      displayName: text(2, 100),
      newPassword: z.string().min(12).max(128),
      confirmPassword: z.string(),
    })
    .refine((v) => v.newPassword === v.confirmPassword)
    .safeParse(Object.fromEntries(form));
  if (creating && (!v.platformAdmin || !credentials.success))
    return {
      error: 'إنشاء حساب وكيل جديد لأدمن المنصة فقط، مع اسم وكلمة مرور متطابقة لا تقل عن ١٢ حرفًا.',
    };
  const passwordHash =
    creating && credentials.success ? await hashPassword(credentials.data.newPassword) : null;
  try {
    await db.transaction(async (tx) => {
      const { institution, organization, scope } = await resolveScope(tx, parsed.data);
      const [actor] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (
        !v.platformAdmin &&
        !canManageAgents(actor, scope, institution.active && (!organization || organization.active))
      )
        throw new Error('forbidden');
      if (
        !v.platformAdmin &&
        sections &&
        ['student_union', 'student_activity'].includes(actor?.department || '') &&
        Object.entries(sections).some(([section, rights]) =>
          Object.entries(rights).some(
            ([right, enabled]) =>
              enabled &&
              !hasSectionRight(actor, section, right as 'canRead' | 'canEdit' | 'canPublish'),
          ),
        )
      )
        throw new Error('cannot delegate absent rights');
      let [person] = await tx.select().from(user).where(eq(user.email, parsed.data.email)).limit(1);
      if (creating) {
        if (person || !passwordHash || !credentials.success) throw new Error('existing account');
        const personId = crypto.randomUUID(),
          now = new Date();
        [person] = await tx
          .insert(user)
          .values({
            id: personId,
            name: credentials.data.displayName,
            email: parsed.data.email,
            emailVerified: false,
          })
          .returning();
        await tx.insert(account).values({
          id: crypto.randomUUID(),
          accountId: personId,
          userId: personId,
          providerId: 'credential',
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        });
        await audit(tx, v.user.id, institution.id, 'agent.login-created', personId);
      }
      if (!person || person.id === v.user.id) throw new Error('account unavailable');
      const [admin] = await tx
        .select()
        .from(platformAdmins)
        .where(eq(platformAdmins.userId, person.id))
        .limit(1);
      const [assigned] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, person.id))
        .limit(1);
      if (admin || assigned) throw new Error('already assigned');
      const id = crypto.randomUUID();
      await tx.insert(institutionAgents).values({
        id,
        userId: person.id,
        ...scope,
        position: parsed.data.position,
        ...flags,
        ...(sections ? { sectionPermissions: sections } : {}),
        status: 'pending',
        isSuperAgent: v.platformAdmin && form.get('isSuperAgent') === 'on',
      });
      await audit(tx, v.user.id, institution.id, 'agent.added-pending', id);
    });
    refresh();
    return {
      success: 'تمت إضافة الحساب بالصلاحيات المحددة، بانتظار تفعيل أدمن المنصة.',
    };
  } catch {
    reportFailure('modules.institution.actions');
    return {
      error: 'تعذر إضافة الوكيل، تحقق من تسجيل الحساب، ونطاق الكلية والجهة، وعدم وجود تعيين سابق.',
    };
  }
}
export async function updateInstitutionAgent(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const parsed = z
    .object({ id: text(1, 100), position, status: z.enum(['pending', 'active', 'suspended']) })
    .safeParse(Object.fromEntries(form));
  const sections = parseSectionPermissions(form);
  const flags = sections ? aggregateSectionPermissions(sections) : permissionFlags(form);
  if (!parsed.success || !validFlags(flags) || !validSectionPermissions(sections)) return fail();
  try {
    await db.transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.id, parsed.data.id))
        .for('update')
        .limit(1);
      if (
        !target ||
        target.userId === v.user.id ||
        !validPosition(target.department, parsed.data.position)
      )
        throw new Error('invalid target');
      const { institution, organization } = await resolveScope(tx, {
        ...target,
        department: target.department as Department,
        facultyId: target.facultyId || undefined,
        organizationId: target.organizationId || undefined,
      });
      const [actor] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (!institution.active && parsed.data.status === 'active')
        throw Error('institution disabled');
      if (
        !v.platformAdmin &&
        (!canManageAgents(
          actor,
          target,
          institution.active && (!organization || organization.active),
        ) ||
          parsed.data.status !== target.status)
      )
        throw new Error('forbidden');
      if (
        !v.platformAdmin &&
        sections &&
        ['student_union', 'student_activity'].includes(actor?.department || '') &&
        Object.entries(sections).some(([section, rights]) =>
          Object.entries(rights).some(
            ([right, enabled]) =>
              enabled &&
              !hasSectionRight(actor, section, right as 'canRead' | 'canEdit' | 'canPublish'),
          ),
        )
      )
        throw new Error('cannot delegate absent rights');
      if (['student_union', 'student_activity'].includes(target.department) && !sections)
        throw new Error('section permissions required');
      if (
        sections &&
        !['student_union', 'student_activity', 'private_sector'].includes(target.department)
      )
        throw new Error('invalid section target');
      if (target.department === 'student_activity' && sections) {
        for (const key of ['academic', 'team'] as const) {
          if (Object.values(sections[key] || {}).some(Boolean))
            throw Error('union only academic grants');
        }
      }
      if (sections && target.sectionPermissions?.trip)
        sections.trip = target.sectionPermissions.trip;
      if (sections && target.sectionPermissions?.training)
        sections.training = target.sectionPermissions.training;
      await tx
        .update(institutionAgents)
        .set({
          position: parsed.data.position,
          status: parsed.data.status,
          ...(sections ? aggregateSectionPermissions(sections) : flags),
          ...(sections ? { sectionPermissions: sections } : {}),
          isSuperAgent: v.platformAdmin ? form.get('isSuperAgent') === 'on' : target.isSuperAgent,
          updatedAt: new Date(),
        })
        .where(eq(institutionAgents.id, target.id));
      await audit(
        tx,
        v.user.id,
        target.institutionId,
        v.platformAdmin ? 'agent.reviewed' : 'officer.permissions-updated',
        target.id,
      );
    });
    refresh();
    return { success: 'تم حفظ قرار الحساب وصلاحياته ضمن نطاقك.' };
  } catch {
    reportFailure('modules.institution.actions');
    return fail();
  }
}
export async function saveDomainContent(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const parsed = z
    .object({ id: z.string().max(100).optional(), title: text(2, 160), body: text(10, 20000) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'العنوان حرفان على الأقل والمحتوى ١٠ أحرف على الأقل.' };
  try {
    await db.transaction(async (tx) => {
      const [actor] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      const { id, title, body } = parsed.data;
      const [existing] = id
        ? await tx
            .select()
            .from(institutionContent)
            .where(eq(institutionContent.id, id))
            .for('update')
            .limit(1)
        : [];
      if (id && !existing) throw new Error('not found');
      const requested = scopeInput.safeParse(Object.fromEntries(form));
      const selected = existing || (requested.success ? requested.data : actor);
      if (!selected) throw new Error('no scope');
      const { institution, organization, scope } = await resolveScope(tx, {
        ...selected,
        department: selected.department as Department,
        facultyId: selected.facultyId || undefined,
        organizationId: selected.organizationId || undefined,
      });
      if (
        !v.platformAdmin &&
        (!!actor?.sectionPermissions ||
          !canEditDomain(
            actor,
            scope,
            institution.active && (!organization || organization.active),
          ))
      )
        throw new Error('forbidden');
      if (
        !v.platformAdmin &&
        (existing?.published || form.get('published') === 'on') &&
        !actor?.canPublish
      )
        throw new Error('cannot publish');
      const entityId = id || crypto.randomUUID();
      const data = {
        title,
        body,
        published: form.get('published') === 'on',
        updatedAt: new Date(),
      };
      if (existing)
        await tx.update(institutionContent).set(data).where(eq(institutionContent.id, entityId));
      else
        await tx
          .insert(institutionContent)
          .values({ id: entityId, ...scope, ...data, authorId: v.user.id });
      await audit(
        tx,
        v.user.id,
        institution.id,
        existing ? 'domain-content.updated' : 'domain-content.created',
        entityId,
      );
    });
    refresh();
    return { success: 'تم حفظ المحتوى في قسمك فقط، المنشور يظهر للطلاب المؤهلين في النطاق.' };
  } catch {
    reportFailure('modules.institution.actions');
    return fail();
  }
}

// Deletion is a tombstone so requests, students and audit records keep their references.
export async function changeInstitutionState(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (!v.platformAdmin) return fail();
  const parsed = z
    .object({
      id: text(1, 100),
      operation: z.enum(['disable', 'enable', 'delete']),
      confirmation: z.string().default(''),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail();
  try {
    await db.transaction(async (tx) => {
      const [admin] = await tx
        .select()
        .from(platformAdmins)
        .where(eq(platformAdmins.userId, v.user.id))
        .for('share')
        .limit(1);
      if (!admin) throw Error('forbidden');
      const [target] = await tx
        .select()
        .from(institutions)
        .where(eq(institutions.id, parsed.data.id))
        .for('update')
        .limit(1);
      if (!target || target.deletedAt) throw Error('not found');
      const { operation, confirmation } = parsed.data;
      if (operation === 'delete' && confirmation !== target.name)
        throw Error('confirmation required');
      await tx
        .update(institutions)
        .set({
          active: operation === 'enable',
          ...(operation === 'delete' ? { deletedAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(eq(institutions.id, target.id));
      if (operation !== 'enable')
        await tx
          .update(institutionAgents)
          .set({ status: 'suspended', updatedAt: new Date() })
          .where(eq(institutionAgents.institutionId, target.id));
      await audit(tx, v.user.id, target.id, 'institution.' + operation, target.id);
    });
    refresh();
    return {
      success:
        parsed.data.operation === 'delete'
          ? 'تم حذف المؤسسة من القوائم وإيقاف وكلائها، مع الاحتفاظ بالسجلات المرتبطة.'
          : parsed.data.operation === 'disable'
            ? 'تم تعطيل المؤسسة وإيقاف جميع وكلائها.'
            : 'تمت إعادة إتاحة المؤسسة، تفعيل الوكلاء يحتاج مراجعة منفصلة.',
    };
  } catch {
    reportFailure('modules.institution.actions');
    return { error: 'تعذر تنفيذ الإجراء، تحقق من الصلاحية واسم المؤسسة عند تأكيد الحذف.' };
  }
}

export async function toggleAdminAccount(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const parsed = z
    .object({ id: text(1, 100), kind: z.enum(['student', 'agent']) })
    .safeParse(Object.fromEntries(form));
  if (!v.platformAdmin || !parsed.success) return fail();
  try {
    await db.transaction(async (tx) => {
      const [admin] = await tx
        .select()
        .from(platformAdmins)
        .where(eq(platformAdmins.userId, v.user.id))
        .for('share')
        .limit(1);
      if (!admin) throw Error('forbidden');
      if (parsed.data.kind === 'student') {
        const [target] = await tx
          .select()
          .from(memberships)
          .where(eq(memberships.id, parsed.data.id))
          .for('update')
          .limit(1);
        if (!target || target.role !== 'student' || target.userId === v.user.id)
          throw Error('invalid student');
        const status = target.status === 'active' ? 'suspended' : 'active';
        await tx.update(memberships).set({ status }).where(eq(memberships.id, target.id));
        // The coordinator grant follows the student account's suspension, not a separate account.
        if (status === 'suspended')
          await tx
            .update(institutionAgents)
            .set({ status, updatedAt: new Date() })
            .where(
              and(
                eq(institutionAgents.userId, target.userId),
                inArray(institutionAgents.department, ['student_union', 'student_activity']),
              ),
            );
        else {
          const [coordinator] = await tx
            .select()
            .from(institutionAgents)
            .where(
              and(
                eq(institutionAgents.userId, target.userId),
                inArray(institutionAgents.department, ['student_union', 'student_activity']),
              ),
            )
            .for('update')
            .limit(1);
          if (coordinator) {
            const { institution, organization } = await resolveScope(tx, {
              ...coordinator,
              department: coordinator.department as Department,
              facultyId: coordinator.facultyId || undefined,
              organizationId: coordinator.organizationId || undefined,
            });
            if (institution.active && (!organization || organization.active))
              await tx
                .update(institutionAgents)
                .set({ status: 'active', updatedAt: new Date() })
                .where(eq(institutionAgents.id, coordinator.id));
          }
        }
        await tx.insert(auditEvents).values({
          id: crypto.randomUUID(),
          actorId: v.user.id,
          universityId: target.universityId,
          action: 'membership.' + status,
          entityId: target.id,
        });
      } else {
        const [target] = await tx
          .select()
          .from(institutionAgents)
          .where(eq(institutionAgents.id, parsed.data.id))
          .for('update')
          .limit(1);
        if (!target || target.userId === v.user.id) throw Error('invalid agent');
        const { institution, organization } = await resolveScope(tx, {
          ...target,
          department: target.department as Department,
          facultyId: target.facultyId || undefined,
          organizationId: target.organizationId || undefined,
        });
        const status = target.status === 'active' ? 'suspended' : 'active';
        if (status === 'active' && (!institution.active || (organization && !organization.active)))
          throw Error('institution disabled');
        await tx
          .update(institutionAgents)
          .set({ status, updatedAt: new Date() })
          .where(eq(institutionAgents.id, target.id));
        await audit(tx, v.user.id, institution.id, 'agent.' + status, target.id);
      }
    });
    refresh();
    return { success: 'تم تحديث الحالة.' };
  } catch {
    reportFailure('modules.institution.actions');
    return { error: 'تعذر تحديث الحالة، تأكد من إتاحة المؤسسة والصلاحيات.' };
  }
}
