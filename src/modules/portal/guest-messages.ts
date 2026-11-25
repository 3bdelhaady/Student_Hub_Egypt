'use server';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { guestMessages } from '@/db/schema';
import { requireViewer } from '@/lib/session';
import { type FormState, text } from '../shared/form-state';

const success = 'وصلت رسالتك وسنرد عليك على بريدك';
const hourAgo = () => new Date(Date.now() - 60 * 60 * 1000);

export async function submitGuestMessage(_: FormState, form: FormData): Promise<FormState> {
  // Hidden field that real visitors never fill; bots that do get a silent success.
  if (String(form.get('website') || '').trim()) return { success };
  const parsed = z
    .object({
      name: text(2, 80).refine((v) => !/https?:|www\./i.test(v) && !/[<>]/.test(v)),
      email: z.string().trim().toLowerCase().max(160).email(),
      subject: text(3, 160),
      body: text(10, 6000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'تحقق من الاسم والبريد الإلكتروني واكتب عنوانًا ورسالة واضحة.' };
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || h.get('x-real-ip') || 'unknown').split(',')[0].trim();
  const ipHash = createHash('sha256')
    .update('guest-message:' + ip)
    .digest('hex')
    .slice(0, 32);
  const since = hourAgo();
  const count = async (where: ReturnType<typeof eq>) =>
    Number(
      (
        await db
          .select({ n: sql<number>`count(*)` })
          .from(guestMessages)
          .where(and(where, gt(guestMessages.createdAt, since)))
      )[0]?.n || 0,
    );
  const [byIp, byEmail, total] = await Promise.all([
    count(eq(guestMessages.ipHash, ipHash)),
    count(eq(guestMessages.email, parsed.data.email)),
    Number(
      (
        await db
          .select({ n: sql<number>`count(*)` })
          .from(guestMessages)
          .where(gt(guestMessages.createdAt, since))
      )[0]?.n || 0,
    ),
  ]);
  if (byIp >= 5 || byEmail >= 3 || total >= 200)
    return { error: 'أرسلت عدة رسائل خلال وقت قصير، حاول مرة أخرى بعد ساعة.' };
  await db.insert(guestMessages).values({
    id: crypto.randomUUID(),
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    body: parsed.data.body,
    ipHash,
  });
  revalidatePath('/manage/guest-messages');
  return { success };
}

export async function setGuestMessageStatus(form: FormData) {
  const v = await requireViewer();
  if (!v.platformAdmin) return;
  const p = z
    .object({ id: z.string().max(100), status: z.enum(['new', 'read', 'archived']) })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return;
  await db
    .update(guestMessages)
    .set({ status: p.data.status })
    .where(eq(guestMessages.id, p.data.id));
  revalidatePath('/manage/guest-messages');
}
