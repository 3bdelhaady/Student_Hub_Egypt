'use server';
import { reportFailure } from '@/lib/diagnostics';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  institutionAgents,
  socialPosts,
  socialPostMedia,
  portalNotifications,
  institutionAuditEvents,
} from '@/db/schema';
import { requireViewer } from '@/lib/session';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { activeEntryScope } from '@/modules/portal/queries';
import { cairoDate } from '@/modules/shared/datetime';
import { refresh, type FormState } from '@/modules/shared/form-state';
import { socialAccess, sameSocialScope } from './policy';
import { validSocialMedia, socialMediaSignature } from './media';
const input = z.object({
  contentType: z.enum(['text', 'image', 'video']).default('text'),
  channel: z.enum(['facebook', 'instagram', 'linkedin', 'youtube']),
  scope: z.enum(['faculty', 'university']),
  body: z.string().trim().max(10000),
});
async function content(
  form: FormData,
  kind: string,
  body: string,
  existing?: typeof socialPosts.$inferSelect,
) {
  if (kind === 'text') {
    if (body.length < 10) throw Error('text');
    return { meta: { mediaName: null, mediaType: null, mediaSize: null }, data: null };
  }
  const file = form.get('media');
  if (!(file instanceof File) || !file.size) {
    if (existing?.contentType === kind && existing.mediaType && existing.mediaSize)
      return {
        meta: {
          mediaName: existing.mediaName,
          mediaType: existing.mediaType,
          mediaSize: existing.mediaSize,
        },
        data: undefined,
      };
    throw Error('file required');
  }
  if (!validSocialMedia(kind, file.type, file.size)) throw Error('file');
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!socialMediaSignature(file.type, bytes)) throw Error('signature');
  return {
    meta: {
      mediaName: file.name.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 150),
      mediaType: file.type,
      mediaSize: file.size,
    },
    data: bytes.toString('base64'),
  };
}
export async function submitSocialPost(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const p = input.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'راجع القناة والنطاق ومحتوى المنشور.' };
  try {
    await db.transaction(async (tx) => {
      const [a] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (
        !a ||
        !isAgentMode(v) ||
        !socialAccess(a, await activeEntryScope(a, tx), true) ||
        !['student_union', 'student_activity'].includes(a.department)
      )
        throw Error('forbidden');
      const media = await content(form, p.data.contentType, p.data.body);
      const id = crypto.randomUUID();
      await tx.insert(socialPosts).values({
        id,
        authorId: v.user.id,
        institutionId: a.institutionId,
        universityId: a.universityId!,
        facultyId: a.facultyId!,
        ...p.data,
        ...media.meta,
      });
      if (media.data) await tx.insert(socialPostMedia).values({ postId: id, data: media.data });
      const reviewers = await tx
        .select()
        .from(institutionAgents)
        .where(
          and(
            eq(institutionAgents.institutionId, a.institutionId),
            eq(institutionAgents.universityId, a.universityId!),
            eq(institutionAgents.facultyId, a.facultyId!),
            eq(institutionAgents.department, 'student_affairs'),
            eq(institutionAgents.status, 'active'),
            eq(institutionAgents.canRead, true),
          ),
        );
      if (reviewers.length)
        await tx.insert(portalNotifications).values(
          reviewers.map((r) => ({
            id: crypto.randomUUID(),
            userId: r.userId,
            title: 'منشور جديد لمراجعة شؤون الطلاب',
            body: 'طلب نشر على قناة تواصل، لم يُنشر خارج المنصة.',
            href: '/manage/social',
          })),
        );
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: a.institutionId,
        action: 'social.submitted',
        entityId: id,
      });
    });
    refresh();
    return { success: 'أُرسل المنشور إلى شؤون الطلاب، لم يتم نشره على أي قناة.' };
  } catch {
    reportFailure('modules.social.actions');
    return {
      error:
        'تعذر إرسال المنشور، تحقق من الصلاحيات ومن نص لا يقل عن 10 أحرف أو صورة أو فيديو صالح لا يتجاوز 3 ميجابايت.',
    };
  }
}
export async function reviewSocialPost(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireViewer();
  const p = input
    .extend({
      id: z.string().min(1).max(100),
      intent: z.enum(['edit', 'approve', 'reject', 'schedule', 'publish']),
      reviewNote: z.string().trim().max(2000),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'راجع بيانات المنشور والقرار.' };
  try {
    await db.transaction(async (tx) => {
      const [a] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, v.user.id))
        .for('share')
        .limit(1);
      if (
        !a ||
        !isAgentMode(v) ||
        a.department !== 'student_affairs' ||
        !socialAccess(a, await activeEntryScope(a, tx), true)
      )
        throw Error('forbidden');
      const [post] = await tx
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.id, p.data.id))
        .for('update')
        .limit(1);
      if (
        !post ||
        !sameSocialScope(a, post) ||
        form.get('revision') !== post.updatedAt.toISOString()
      )
        throw Error('stale');
      const media = await content(form, p.data.contentType, p.data.body, post);
      if (p.data.intent === 'publish' && !['approved', 'scheduled', 'ready'].includes(post.status))
        throw Error('approval required');
      if (
        p.data.intent === 'publish' &&
        (p.data.contentType !== post.contentType ||
          (media.data !== undefined && media.data !== null) ||
          p.data.body !== post.body ||
          p.data.channel !== post.channel ||
          p.data.scope !== post.scope)
      )
        throw Error('review changes first');
      const scheduledAt =
        p.data.intent === 'schedule' ? cairoDate(String(form.get('scheduledAt') || '')) : null;
      if (p.data.intent === 'schedule' && (!scheduledAt || scheduledAt <= new Date()))
        throw Error('date');
      const status = {
        edit: 'pending',
        approve: 'approved',
        reject: 'rejected',
        schedule: 'scheduled',
        publish: 'ready',
      }[p.data.intent];
      await tx
        .update(socialPosts)
        .set({
          contentType: p.data.contentType,
          ...media.meta,
          body: p.data.body,
          channel: p.data.channel,
          scope: p.data.scope,
          reviewNote: p.data.reviewNote,
          status,
          scheduledAt,
          reviewerId: v.user.id,
          updatedAt: new Date(),
        })
        .where(eq(socialPosts.id, post.id));
      if (media.data === null)
        await tx.delete(socialPostMedia).where(eq(socialPostMedia.postId, post.id));
      else if (media.data !== undefined)
        await tx
          .insert(socialPostMedia)
          .values({ postId: post.id, data: media.data })
          .onConflictDoUpdate({ target: socialPostMedia.postId, set: { data: media.data } });
      await tx.insert(institutionAuditEvents).values({
        id: crypto.randomUUID(),
        actorId: v.user.id,
        institutionId: a.institutionId,
        action: 'social.' + p.data.intent,
        entityId: post.id,
      });
      await tx.insert(portalNotifications).values({
        id: crypto.randomUUID(),
        userId: post.authorId,
        title: 'تحديث طلب منشور التواصل',
        body:
          p.data.intent === 'publish'
            ? 'المنشور جاهز فقط، القنوات الرسمية غير مرتبطة ولم يحدث نشر خارجي.'
            : 'راجع قرار شؤون الطلاب داخل الخدمة.',
        href: '/manage/social',
      });
    });
    refresh();
    return {
      success:
        p.data.intent === 'publish'
          ? 'القنوات الرسمية غير مرتبطة، لم يتم النشر أو الإرسال خارج المنصة.'
          : 'تم حفظ المنشور وقرار المراجعة داخل المنصة فقط.',
    };
  } catch {
    reportFailure('modules.social.actions');
    return {
      error:
        'تعذر حفظ القرار، تحقق من الصلاحيات والنطاق والموعد ونوع الملف وحجمه (3 ميجابايت كحد أقصى)، حدّث الصفحة إذا تغيّر المنشور.',
    };
  }
}
