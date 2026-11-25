'use server';
import { reportFailure } from '@/lib/diagnostics';
import { allocateTeamMarker } from '@/modules/academic-teams/settings';
import { restaurantFromForm, restaurantDetails } from './restaurants';
import { housingFromForm } from './housing';
import { courseInStudentScope } from '@/modules/agent-academic/queries';
import { volunteerDivisionsInput } from '@/modules/volunteering/policy';
import { pollPhase } from './polls';
import { opportunityInput, demoOpportunities } from './opportunities';
import { applicationProfile } from './application-profile';
import { studentSupportRecipients, supportAccess } from './support';
import { z } from 'zod';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { db } from '@/db';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { requireViewer, requireStudentViewer } from '@/lib/session';
import {
  academicTeamMembers,
  portalEntries,
  teamCourseSettings,
  volunteerDivisions,
  courses,
  portalRequests,
  requestMessages,
  portalSaved,
  portalNotifications,
  pollOptions,
  pollVotes,
  studentProfiles,
  supportDestinations,
  institutionAgents,
  institutionAuditEvents,
  user,
} from '@/db/schema';
import { type FormState, text, fail, refresh } from '../shared/form-state';
import {
  entryKinds,
  commerceKinds,
  canStudentReadEntry,
  safeMediaUrl,
  validRequestTransition,
  cairoDate,
} from './policy';
import { activeStudentEntryScope, canManagePortalEntry } from './queries';
import { resolveScope } from '../institution/service';
import { hasSectionRight } from '../institution/section-policy';
import { canEditPortal } from './management-policy';

export async function saveStudentProfile(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const p = z
    .object({
      name: text(2, 100),
      phone: z
        .string()
        .trim()
        .max(24)
        .refine((x) => !x || /^\+?[0-9\s()-]{7,24}$/.test(x)),
      level: z.enum(['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'دراسات عليا']),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'راجع الاسم ورقم الهاتف والمستوى الدراسي.' };
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({ name: p.data.name, updatedAt: new Date() })
        .where(eq(user.id, v.user.id));
      const { name: _, ...data } = p.data;
      await tx
        .insert(studentProfiles)
        .values({ userId: v.user.id, ...data })
        .onConflictDoUpdate({
          target: studentProfiles.userId,
          set: { ...data, updatedAt: new Date() },
        });
    });
    refresh();
    return {
      success:
        'تم حفظ بياناتك الشخصية، الجامعة والكلية تتبعان العضوية المعتمدة ولا تتغيران من هذا النموذج.',
    };
  } catch {
    reportFailure('modules.portal.actions');
    return fail();
  }
}
export async function savePortalEntry(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (form.get('kind') === 'team' && form.get('id'))
    return { error: 'تعديل الفريق متاح من وصف الفريق فقط.' };
  if (form.get('kind') === 'service' && form.get('minimalOpportunity') === '1') {
    for (const [key, value] of Object.entries({
      category: '',
      imageUrl: '',
      location: '',
      price: '0',
      capacity: '',
      startsAt: '',
      closesAt: '',
      provider: '',
      requirements: '',
    }))
      form.set(key, value);
    form.set('published', form.get('intent') === 'publish' ? 'on' : '');
  }
  if (form.get('kind') === 'poll' && form.get('minimalPoll') === '1') {
    for (const [key, value] of Object.entries({
      description: String(form.get('title') || '') + ' - تصويت طلابي',
      category: '',
      imageUrl: '',
      location: '',
      price: '0',
      capacity: '',
      startsAt: '',
      closesAt: '',
    }))
      form.set(key, value);
    form.set('published', form.get('intent') === 'publish' ? 'on' : '');
  }
  const p = z
    .object({
      id: z.string().max(100).optional(),
      institutionId: text(1, 100),
      facultyId: z.string().max(100).optional(),
      organizationId: z.string().max(100).optional(),
      department: z.enum([
        'student_affairs',
        'youth_welfare',
        'private_sector',
        'student_union',
        'student_activity',
      ]),
      kind: z.enum(entryKinds),
      ticketType: z.enum(['', 'concert', 'graduation', 'standup', 'trip']).optional().default(''),
      title: text(2, 160),
      description: text(10, 12000),
      teamCourseId: z.string().max(100).optional().default(''),
      teamMarker: z.string().trim().max(6).optional().default(''),
      category: z.string().trim().max(80),
      imageUrl: z.string().trim().max(1500).refine(safeMediaUrl),
      location: z.string().trim().max(200),
      price: z.coerce.number().min(0).max(1000000),
      capacity: z.union([z.literal(''), z.coerce.number().int().min(0).max(100000)]),
      startsAt: z.string().max(40),
      closesAt: z.string().max(40),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'راجع الحقول، استخدم رابط صورة HTTPS وسعرًا وسعة صحيحين.' };
  try {
    await db.transaction(async (tx) => {
      const { id, price, capacity, startsAt, closesAt, teamCourseId, teamMarker, ...input } =
        p.data;
      const { institution, organization, scope } = await resolveScope(tx, input);
      if (
        form.get('published') === 'on' &&
        (!institution.active || (organization && !organization.active))
      )
        throw new Error('inactive');
      const [a] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      const publishing = form.get('published') === 'on';
      if (input.kind === 'ticket' && !input.ticketType) throw new Error('ticket subtype required');
      if (
        !v.platformAdmin &&
        (!canEditPortal(
          a,
          { ...scope, kind: input.kind, ticketType: input.ticketType },
          institution.active && (!organization || organization.active),
        ) ||
          (publishing &&
            !hasSectionRight(
              a,
              input.kind === 'ticket' && input.ticketType === 'trip' ? 'trip' : input.kind,
              'canPublish',
            )))
      )
        throw new Error('forbidden');
      const [old] = id
        ? await tx
            .select()
            .from(portalEntries)
            .where(eq(portalEntries.id, id))
            .for('update')
            .limit(1)
        : [];
      if (old?.archived) throw new Error('archived');
      if (
        old?.kind === 'service' &&
        !v.platformAdmin &&
        ['student_union', 'student_activity'].includes(a?.department || '') &&
        old.authorId !== v.user.id
      )
        throw Error('not own item');
      if (id && (!old || !(await canManagePortalEntry(v, old, tx)))) throw new Error('forbidden');
      if (
        old &&
        (old.kind !== input.kind ||
          old.institutionId !== scope.institutionId ||
          old.department !== scope.department ||
          old.facultyId !== scope.facultyId ||
          old.organizationId !== scope.organizationId)
      )
        throw new Error('immutable scope');
      if (
        old?.published &&
        !v.platformAdmin &&
        !hasSectionRight(
          a,
          old.kind === 'ticket' && old.ticketType === 'trip' ? 'trip' : old.kind,
          'canPublish',
        )
      )
        throw new Error('publish required');
      const start = cairoDate(startsAt),
        close = cairoDate(closesAt);
      if ((start && !Number.isFinite(+start)) || (close && !Number.isFinite(+close)))
        throw new Error('date');
      if (input.kind === 'poll' && old) {
        const [vote] = await tx
          .select({ id: pollVotes.id })
          .from(pollVotes)
          .where(eq(pollVotes.entryId, old.id))
          .limit(1);
        if (vote) throw new Error('poll locked');
      }
      let automaticMarker = old?.teamMarker || '',
        teamMax: number | undefined;
      const linkedCourseId = input.kind === 'team' ? teamCourseId || null : null;
      if (input.kind === 'team' && !old && !linkedCourseId) throw Error('team course required');
      if (linkedCourseId) {
        const [course] = await tx
          .select()
          .from(courses)
          .where(eq(courses.id, linkedCourseId))
          .for('share')
          .limit(1);
        if (
          !course ||
          !scope.universityId ||
          course.universityId !== scope.universityId ||
          (publishing && !course.published) ||
          !(await courseInStudentScope(
            course.id,
            { status: 'active', universityId: scope.universityId!, facultyId: scope.facultyId },
            tx,
          ))
        )
          throw new Error('team course');
        if (!old || old.teamCourseId !== linkedCourseId) {
          if (!scope.facultyId) throw Error('team faculty');
          const setting = await allocateTeamMarker(tx, linkedCourseId, scope.facultyId);
          automaticMarker = setting.marker;
          teamMax = setting.maxMembers;
        }
        if (old && scope.facultyId) {
          const [setting] = await tx
            .select()
            .from(teamCourseSettings)
            .where(
              and(
                eq(teamCourseSettings.courseId, linkedCourseId),
                eq(teamCourseSettings.facultyId, scope.facultyId),
              ),
            )
            .for('share')
            .limit(1);
          if (setting) teamMax = setting.maxMembers;
        }
        if (teamMax !== undefined && (capacity === '' || capacity > teamMax))
          throw Error('team member limit');
      }
      if (old?.kind === 'team' && old.teamCourseId !== linkedCourseId) {
        const [request] = await tx
          .select({ id: portalRequests.id })
          .from(portalRequests)
          .where(eq(portalRequests.entryId, old.id))
          .limit(1);
        if (request) throw new Error('team course locked by requests');
      }
      const opportunity = opportunityInput.parse({
        opportunityType: String(form.get('opportunityType') || ''),
        provider: String(form.get('provider') || ''),
        requirements: String(form.get('requirements') || ''),
      });
      const entityId = id || crypto.randomUUID();
      const data = {
        ...input,
        pollAudience:
          input.kind === 'poll'
            ? z.enum(['faculty', 'university']).parse(form.get('pollAudience') || 'faculty')
            : ('faculty' as const),
        housingDetails: input.kind === 'housing' ? housingFromForm(form) : undefined,
        ...(input.kind === 'restaurant' ? { location: old?.location || '' } : {}),
        restaurantDetails:
          input.kind === 'restaurant'
            ? { ...restaurantDetails(old?.restaurantDetails), menu: restaurantFromForm(form).menu }
            : undefined,
        ...scope,
        ticketType: input.kind === 'ticket' ? input.ticketType : '',
        opportunityType: input.kind === 'service' ? opportunity.opportunityType : '',
        provider: input.kind === 'service' ? opportunity.provider : '',
        requirements: input.kind === 'service' ? opportunity.requirements : '',
        teamCourseId: linkedCourseId,
        teamMarker: input.kind === 'team' ? automaticMarker : '',
        priceMinor: Math.round(price * 100),
        capacity: capacity === '' ? null : capacity,
        startsAt: start,
        closesAt: close,
        published: publishing,
        updatedAt: new Date(),
      };
      if (old) await tx.update(portalEntries).set(data).where(eq(portalEntries.id, entityId));
      else await tx.insert(portalEntries).values({ ...data, id: entityId, authorId: v.user.id });
      if (input.kind === 'poll') {
        const labels = String(form.get('options') || '')
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean);
        if (
          labels.length < 2 ||
          labels.length > 5 ||
          labels.some((x) => x.length > 160) ||
          new Set(labels).size !== labels.length
        )
          throw new Error('options');
        await tx.delete(pollOptions).where(eq(pollOptions.entryId, entityId));
        await tx
          .insert(pollOptions)
          .values(labels.map((label) => ({ id: crypto.randomUUID(), entryId: entityId, label })));
      }
      if (input.kind === 'volunteer') {
        const divisions = volunteerDivisionsInput.parse(
          JSON.parse(String(form.get('volunteerDivisions') || '[]')),
        );
        const oldDivisions = await tx
          .select()
          .from(volunteerDivisions)
          .where(eq(volunteerDivisions.entryId, entityId))
          .for('update');
        if (divisions.some((d) => d.id && !oldDivisions.some((old) => old.id === d.id)))
          throw new Error('division scope');
        // Clear labels before updates to allow safe label swaps under the unique index.
        for (const oldDivision of oldDivisions) {
          if (!divisions.some((d) => d.id === oldDivision.id))
            await tx.delete(volunteerDivisions).where(eq(volunteerDivisions.id, oldDivision.id));
          else
            await tx
              .update(volunteerDivisions)
              .set({ label: '__edit_' + crypto.randomUUID() })
              .where(eq(volunteerDivisions.id, oldDivision.id));
        }
        for (const [position, division] of divisions.entries()) {
          const data = {
            label: division.label,
            description: division.description,
            active: division.active,
            position,
          };
          if (division.id)
            await tx
              .update(volunteerDivisions)
              .set(data)
              .where(
                and(
                  eq(volunteerDivisions.id, division.id),
                  eq(volunteerDivisions.entryId, entityId),
                ),
              );
          else
            await tx
              .insert(volunteerDivisions)
              .values({ id: crypto.randomUUID(), entryId: entityId, ...data });
        }
      }
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: scope.institutionId,
        action: old ? 'portal.updated' : 'portal.created',
        entityId,
      });
    });
    refresh();
    return { success: 'تم حفظ الخدمة ومراجعة صلاحيات النشر.' };
  } catch {
    reportFailure('modules.portal.actions');
    return {
      error:
        'تعذر الحفظ، راجع النطاق والمقرر المرتبط والتواريخ وخيارات التصويت، التصويت الذي بدأ لا يمكن تعديل خياراته، ومقرر الفريق الذي له طلبات لا يتغير، أقسام التطوع تحتاج أسماء فريدة ضمن نفس الفرصة.',
    };
  }
}
export async function submitPortalRequest(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (form.get('entryId') || form.get('opportunityId')) await requireStudentViewer();
  const p = z
    .object({
      entryId: z.string().max(100).optional(),
      subject: text(3, 160),
      body: text(10, 6000),
      quantity: z.coerce.number().int().min(1).max(99),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'اكتب عنوانًا ووصفًا واضحًا وكمية صحيحة.' };
  try {
    let ref = '';
    await db.transaction(async (tx) => {
      const opportunityId = String(form.get('opportunityId') || '');
      let applicationBody = '';
      let applicationSubject = '';
      if (opportunityId) {
        if (form.get('applicationConsent') !== 'on') throw new Error('consent');
        await tx.select({ id: user.id }).from(user).where(eq(user.id, v.user.id)).for('update');
        const profile = await applicationProfile(v.user.id, tx);
        if (profile.digest !== form.get('profileDigest')) throw new Error('profile changed');
        const demo = demoOpportunities.find((e) => e.id === opportunityId);
        if (
          demo &&
          (p.data.entryId || (form.get('recipient') && form.get('recipient') !== 'admin'))
        )
          throw new Error('destination');
        if (!demo && p.data.entryId !== opportunityId) throw new Error('opportunity');
        if (demo && process.env.VERCEL) throw Error('unavailable');
        if (demo) {
          applicationSubject = 'تقديم: ' + demo.title;
          const existing = await tx
            .select({ id: portalRequests.id })
            .from(portalRequests)
            .where(
              and(
                eq(portalRequests.userId, v.user.id),
                eq(portalRequests.subject, applicationSubject),
                sql`${portalRequests.status} IN ('pending','reviewing','accepted')`,
              ),
            )
            .limit(1);
          if (existing.length) throw new Error('duplicate');
        }
        applicationBody =
          profile.body +
          '\n\nرسالة التقديم: ' +
          p.data.body +
          '\n\nإرسال داخل المنصة للمراجعة اليدوية فقط، دون تقديم خارجي.';
      }
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
      if (recent.length >= 10) throw new Error('rate limit');
      const [entry] = p.data.entryId
        ? await tx
            .select()
            .from(portalEntries)
            .where(eq(portalEntries.id, p.data.entryId))
            .for('update')
            .limit(1)
        : [];
      if (
        p.data.entryId &&
        (!entry ||
          !canStudentReadEntry(
            v.membership,
            entry,
            await activeStudentEntryScope(entry, v.membership, tx),
          ) ||
          ['poll', 'volunteer'].includes(entry.kind) ||
          (entry.closesAt && entry.closesAt <= new Date()))
      )
        throw new Error('unavailable');
      if (opportunityId && entry && (entry.kind !== 'service' || !entry.opportunityType))
        throw new Error('opportunity');
      if (opportunityId && entry) applicationSubject = ('تقديم: ' + entry.title).slice(0, 160);
      if (entry?.kind === 'team') {
        const [member] = await tx
          .select()
          .from(academicTeamMembers)
          .where(
            and(
              eq(academicTeamMembers.entryId, entry.id),
              eq(academicTeamMembers.userId, v.user.id),
            ),
          )
          .limit(1);
        if (member) throw Error('member');
      }
      if (entry?.capacity === 0) throw new Error('closed');
      if (entry?.capacity && p.data.quantity > entry.capacity) throw new Error('quantity');
      if (entry && commerceKinds.includes(entry.kind)) throw new Error('use store checkout');
      if (entry?.kind === 'team') {
        if (p.data.quantity !== 1 || entry.authorId === v.user.id)
          throw Error('invalid team member');
        const existing = await tx
          .select({ id: portalRequests.id })
          .from(portalRequests)
          .where(
            and(
              eq(portalRequests.entryId, entry.id),
              eq(portalRequests.userId, v.user.id),
              inArray(portalRequests.status, ['pending', 'reviewing', 'accepted', 'completed']),
            ),
          )
          .limit(1);
        if (existing.length) throw Error('duplicate team membership');
      }
      const kind = entry?.kind || 'support';
      ref = 'SH-' + crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
      const id = crypto.randomUUID();
      await tx.insert(portalRequests).values({
        id,
        userId: v.user.id,
        entryId: entry?.id || null,
        kind,
        subject: applicationSubject || p.data.subject,
        body: applicationBody || p.data.body,
        quantity: p.data.quantity,
        unitPriceMinor: entry?.priceMinor || 0,
        reference: ref,
      });
      if (!entry && form.get('recipient') && form.get('recipient') !== 'admin') {
        const target = (await studentSupportRecipients(v, tx)).find(
          (r) => r.id === form.get('recipient'),
        );
        if (!target) throw new Error('recipient scope');
        const { id: _, ...scope } = target;
        await tx.insert(supportDestinations).values({ ...scope, requestId: id });
      }
      await tx.insert(portalNotifications).values({
        id: crypto.randomUUID(),
        userId: v.user.id,
        title: 'تم استلام طلبك',
        body: ref,
        href: '/requests/' + id,
      });
      if (entry?.kind === 'team') {
        const leaders = await tx
          .select()
          .from(academicTeamMembers)
          .where(
            and(eq(academicTeamMembers.entryId, entry.id), eq(academicTeamMembers.role, 'leader')),
          );
        for (const leader of leaders)
          await tx.insert(portalNotifications).values({
            id: crypto.randomUUID(),
            userId: leader.userId,
            title: 'طلب انضمام جديد لفريقك',
            body: ref,
            href: '/services/' + entry.id,
          });
      }
    });
    refresh();
    return { success: 'وصل طلبك برقم ' + ref + '، يمكنك متابعته من صفحة طلباتي.' };
  } catch {
    reportFailure('modules.portal.actions');
    return {
      error:
        'تعذر إرسال الطلب، قد تكون الخدمة مغلقة أو لديك طلب قائم لنفس الخدمة، راجع طلباتك والحقول ثم حاول لاحقًا.',
    };
  }
}
export async function replyToRequest(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const id = String(form.get('requestId') || '');
  const body = text(2, 6000).safeParse(form.get('body'));
  if (!body.success) return fail();
  try {
    await db.transaction(async (tx) => {
      const [r] = await tx
        .select()
        .from(portalRequests)
        .where(eq(portalRequests.id, id))
        .for('update')
        .limit(1);
      if (!r) throw new Error('missing');
      const [e] = r.entryId
        ? await tx.select().from(portalEntries).where(eq(portalEntries.id, r.entryId)).limit(1)
        : [];
      const manager =
        r.kind === 'support'
          ? await supportAccess(v, r.id, true, tx)
          : v.platformAdmin ||
            (!!e &&
              (!r.recipientId || r.recipientId === v.user.id) &&
              (await canManagePortalEntry(v, e, tx)));
      if ((r.userId !== v.user.id || (isAgentMode(v) && r.kind !== 'support')) && !manager)
        throw new Error('forbidden');
      if (['completed', 'rejected', 'cancelled'].includes(r.status)) throw new Error('closed');
      const last = await tx
        .select()
        .from(requestMessages)
        .where(
          and(
            eq(requestMessages.requestId, id),
            eq(requestMessages.authorId, v.user.id),
            sql`${requestMessages.createdAt} > now() - interval '1 minute'`,
          ),
        )
        .limit(6);
      if (last.length >= 6) throw new Error('rate limit');
      await tx
        .insert(requestMessages)
        .values({ id: crypto.randomUUID(), requestId: id, authorId: v.user.id, body: body.data });
      await tx
        .update(portalRequests)
        .set({
          updatedAt: new Date(),
          ...(manager && (v.platformAdmin || isAgentMode(v)) && r.status === 'pending'
            ? { status: 'reviewing' }
            : {}),
        })
        .where(eq(portalRequests.id, id));
      if (r.userId !== v.user.id)
        await tx.insert(portalNotifications).values({
          id: crypto.randomUUID(),
          userId: r.userId,
          title: 'رد جديد على طلبك',
          body: r.reference,
          href: '/requests/' + id,
        });
    });
    refresh();
    return { success: 'تمت إضافة الرد.' };
  } catch {
    reportFailure('modules.portal.actions');
    return fail();
  }
}
export async function decidePortalRequest(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (!v.platformAdmin && !isAgentMode(v)) return fail();
  const id = String(form.get('requestId') || ''),
    status = String(form.get('status') || '');
  try {
    await db.transaction(async (tx) => {
      const [r] = await tx
        .select()
        .from(portalRequests)
        .where(eq(portalRequests.id, id))
        .for('update')
        .limit(1);
      if (!r || r.kind === 'team') throw new Error('missing');
      const [e] = r.entryId
        ? await tx
            .select()
            .from(portalEntries)
            .where(eq(portalEntries.id, r.entryId))
            .for('update')
            .limit(1)
        : [];
      if (
        !(r.kind === 'support'
          ? await supportAccess(v, r.id, true, tx)
          : v.platformAdmin ||
            (!!e &&
              (!r.recipientId || r.recipientId === v.user.id) &&
              (await canManagePortalEntry(v, e, tx))))
      )
        throw Error('forbidden');
      if (
        !['reviewing', 'accepted', 'completed'].includes(status) ||
        !validRequestTransition(r.status, status)
      )
        throw Error('transition');
      if (r.kind === 'team_creation' && e) {
        if (['accepted', 'completed'].includes(status))
          await tx
            .insert(academicTeamMembers)
            .values({ entryId: e.id, userId: r.userId, role: 'leader' })
            .onConflictDoNothing();
        if (['accepted', 'completed'].includes(status))
          await tx.update(portalEntries).set({ published: true }).where(eq(portalEntries.id, e.id));
      }
      if (
        e &&
        r.kind !== 'team_creation' &&
        r.purpose !== 'inspection' &&
        ['accepted', 'completed'].includes(status) &&
        !['accepted', 'completed'].includes(r.status) &&
        e.capacity !== null
      ) {
        if (e.capacity < r.quantity) throw new Error('full');
        await tx
          .update(portalEntries)
          .set({ capacity: e.capacity - r.quantity })
          .where(eq(portalEntries.id, e.id));
      }
      if (r.kind === 'team' && e && ['accepted', 'completed'].includes(status))
        await tx
          .insert(academicTeamMembers)
          .values({ entryId: e.id, userId: r.userId, role: 'member' })
          .onConflictDoNothing();
      await tx
        .update(portalRequests)
        .set({ status, updatedAt: new Date() })
        .where(eq(portalRequests.id, id));
      await tx.insert(portalNotifications).values({
        id: crypto.randomUUID(),
        userId: r.userId,
        title: 'تحديث حالة الطلب',
        body: r.reference,
        href: '/requests/' + id,
      });
      if (e)
        await tx.insert(institutionAuditEvents).values({
          id: crypto.randomUUID(),
          actorId: v.user.id,
          institutionId: e.institutionId,
          action: 'request.' + status,
          entityId: id,
        });
    });
    refresh();
    return { success: 'تم تحديث حالة الطلب.' };
  } catch {
    reportFailure('modules.portal.actions');
    return { error: 'تعذر التحديث، راجع الحالة والسعة والصلاحيات.' };
  }
}
export async function togglePortalSaved(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer(),
    id = String(form.get('entryId') || '');
  const [e] = await db.select().from(portalEntries).where(eq(portalEntries.id, id)).limit(1);
  if (!e || !canStudentReadEntry(v.membership, e, await activeStudentEntryScope(e, v?.membership)))
    return fail();
  try {
    if (form.get('saved') === 'true')
      await db
        .delete(portalSaved)
        .where(and(eq(portalSaved.userId, v.user.id), eq(portalSaved.entryId, id)));
    else
      await db
        .insert(portalSaved)
        .values({ id: crypto.randomUUID(), userId: v.user.id, entryId: id })
        .onConflictDoNothing();
    refresh();
    return { success: form.get('saved') === 'true' ? 'أزيل من المحفوظات.' : 'أضيف إلى المحفوظات.' };
  } catch {
    reportFailure('modules.portal.actions');
    return fail();
  }
}
export async function voteInPoll(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer(),
    id = String(form.get('entryId') || ''),
    optionId = String(form.get('optionId') || '');
  try {
    await db.transaction(async (tx) => {
      const [e] = await tx
        .select()
        .from(portalEntries)
        .where(eq(portalEntries.id, id))
        .for('update')
        .limit(1);
      if (
        !e ||
        e.kind !== 'poll' ||
        pollPhase(e) !== 'open' ||
        !v.membership ||
        v.membership.status !== 'active' ||
        !canStudentReadEntry(v.membership, e, await activeStudentEntryScope(e, v.membership, tx)) ||
        (e.closesAt && e.closesAt <= new Date())
      )
        throw new Error('closed');
      const available = await tx
        .select({ id: pollOptions.id })
        .from(pollOptions)
        .where(eq(pollOptions.entryId, id))
        .limit(2);
      if (available.length < 2) throw new Error('options');
      const [option] = await tx
        .select()
        .from(pollOptions)
        .where(and(eq(pollOptions.id, optionId), eq(pollOptions.entryId, id)))
        .limit(1);
      if (!option) throw new Error('option');
      await tx
        .insert(pollVotes)
        .values({ id: crypto.randomUUID(), entryId: id, optionId, userId: v.user.id });
    });
    refresh();
    return { success: 'تم تسجيل صوتك، لا يمكن التصويت مرتين.' };
  } catch {
    reportFailure('modules.portal.actions');
    return { error: 'تعذر التصويت، قد تكون صوّت بالفعل أو انتهى الاستبيان.' };
  }
}
export async function markNotificationsRead(form: FormData) {
  const v = await requireViewer();
  const id = String(form.get('id') || '');
  await db
    .update(portalNotifications)
    .set({ readAt: new Date() })
    .where(
      id
        ? and(eq(portalNotifications.userId, v.user.id), eq(portalNotifications.id, id))
        : eq(portalNotifications.userId, v.user.id),
    );
  refresh();
}
