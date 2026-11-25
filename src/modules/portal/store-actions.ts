'use server';
import { reportFailure } from '@/lib/diagnostics';
import { priceTicket } from './tickets';
import { checkoutDigest } from './checkout-digest';
import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  portalEntries,
  portalRequests,
  portalNotifications,
  user,
  institutionAgents,
  platformAdmins,
} from '@/db/schema';
import { requireStudentViewer } from '@/lib/session';
import { canStudentReadEntry, commerceKinds } from './policy';
import { activeStudentEntryScope, activeEntryScope } from './queries';
import { canEditPortal } from './management-policy';
import { applicationProfile } from './application-profile';
import { restaurantDetails, priceCart } from './restaurants';
import { housingDetails } from './housing';
import { refresh, type FormState } from '../shared/form-state';
export async function submitStoreOrder(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireStudentViewer();
  const p = z
    .object({
      entryId: z.string().min(1).max(100),
      quantity: z.coerce.number().int().min(1).max(99),
      purpose: z.enum(['purchase', 'inspection']),
      paymentMethod: z.enum(['cash', 'electronic']).optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: 'راجع الخدمة والكمية وطريقة الدفع.' };
  if (p.data.purpose === 'purchase' && p.data.paymentMethod !== 'cash')
    return { error: 'الدفع بكرت مركز الطلاب غير متاح حاليًا، اختر كاش، لم يُخصم أي مبلغ.' };
  try {
    let reference = '';
    await db.transaction(async (tx) => {
      const [e] = await tx
        .select()
        .from(portalEntries)
        .where(eq(portalEntries.id, p.data.entryId))
        .for('update')
        .limit(1);
      if (
        !e ||
        !commerceKinds.includes(e.kind) ||
        !canStudentReadEntry(v.membership, e, await activeStudentEntryScope(e, v.membership, tx)) ||
        e.capacity === 0 ||
        (e.closesAt && e.closesAt <= new Date())
      )
        throw Error('unavailable');
      if (form.get('checkoutDigest') !== checkoutDigest(e)) throw Error('price changed');
      if (p.data.purpose === 'inspection' && e.kind !== 'housing') throw Error('purpose');
      const quantity = ['housing', 'restaurant'].includes(e.kind) ? 1 : p.data.quantity;
      if (e.capacity !== null && e.capacity < quantity) throw Error('capacity');
      const [publisher] = await tx.select().from(user).where(eq(user.id, e.authorId)).limit(1);
      const [admin] = await tx
        .select()
        .from(platformAdmins)
        .where(eq(platformAdmins.userId, e.authorId))
        .limit(1);
      const [agent] = await tx
        .select()
        .from(institutionAgents)
        .where(eq(institutionAgents.userId, e.authorId))
        .limit(1);
      if (!publisher || (!admin && !canEditPortal(agent, e, await activeEntryScope(e, tx))))
        throw Error('publisher unavailable');
      const recent = await tx
        .select({ id: portalRequests.id })
        .from(portalRequests)
        .where(
          and(
            eq(portalRequests.userId, v.user.id),
            sql`${portalRequests.createdAt}>now()-interval '10 minutes'`,
          ),
        )
        .limit(10);
      if (recent.length >= 10) throw Error('rate');
      const profile = await applicationProfile(v.user.id, tx),
        h = housingDetails(e.housingDetails);
      if (form.get('profileDigest') !== profile.digest) throw Error('profile changed');
      const deposit = e.kind === 'housing' ? Math.round(h.deposit * 100) : 0,
        serviceFee = e.kind === 'housing' ? Math.round(h.serviceFee * 100) : 0;
      const restaurant = restaurantDetails(e.restaurantDetails);
      const items =
        e.kind === 'restaurant'
          ? priceCart(restaurant.menu, JSON.parse(String(form.get('cart') || '[]')))
          : [];
      const menuTotal = items.reduce((sum, i) => sum + i.quantity * i.unitPriceMinor, 0);
      const tier =
        e.kind === 'ticket'
          ? priceTicket(e.ticketTiers, e.priceMinor, String(form.get('ticketTierId') || 'standard'))
          : undefined;
      const unitPrice =
        p.data.purpose === 'inspection'
          ? 0
          : tier
            ? tier.priceMinor
            : items.length
              ? menuTotal
              : e.priceMinor;
      const id = crypto.randomUUID();
      reference = 'SH-' + crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
      await tx.insert(portalRequests).values({
        id,
        userId: v.user.id,
        entryId: e.id,
        kind: e.kind,
        subject:
          p.data.purpose === 'inspection' ? ('طلب معاينة: ' + e.title).slice(0, 160) : e.title,
        body:
          profile.body +
          (tier ? '\nنوع التذكرة: ' + tier.title + '\n' + tier.description : '') +
          '\n\n' +
          (p.data.purpose === 'inspection'
            ? 'طلب معاينة السكن، بانتظار تأكيد الناشر.'
            : 'طريقة الدفع: كاش، بانتظار تأكيد الناشر، لم يُحصّل مبلغ عبر الموقع.'),
        quantity,
        unitPriceMinor: unitPrice,
        reference,
        recipientId: e.authorId,
        paymentMethod: p.data.purpose === 'inspection' ? '' : 'cash',
        paymentStatus: p.data.purpose === 'inspection' ? '' : 'unpaid',
        purpose: p.data.purpose,
        orderDetails: {
          deposit: p.data.purpose === 'inspection' ? 0 : deposit,
          serviceFee: p.data.purpose === 'inspection' ? 0 : serviceFee,
          total:
            unitPrice * quantity + (p.data.purpose === 'inspection' ? 0 : deposit + serviceFee),
          publisherName: publisher.name,
          items,
          ...(tier
            ? {
                ticketTier: {
                  id: tier.id,
                  title: tier.title,
                  description: tier.description,
                  unitPriceMinor: tier.priceMinor,
                },
              }
            : {}),
        },
      });
      await tx.insert(portalNotifications).values([
        {
          id: crypto.randomUUID(),
          userId: v.user.id,
          title: 'طلبك بانتظار تأكيد الناشر',
          body: reference,
          href: '/requests/' + id,
        },
        {
          id: crypto.randomUUID(),
          userId: e.authorId,
          title: p.data.purpose === 'inspection' ? 'طلب معاينة سكن جديد' : 'طلب كاش جديد',
          body: reference,
          href: '/requests/' + id,
        },
      ]);
    });
    refresh();
    return {
      success: 'تم إرسال الطلب إلى الناشر وبانتظار تأكيده، رقم ' + reference + '، لم يُخصم أي مبلغ.',
    };
  } catch {
    reportFailure('modules.portal.store-actions');
    return {
      error:
        'تعذر إرسال الطلب، تحقق من توفر الخدمة وعدم وجود طلب قائم، قد لا يكون ناشر الخدمة متاحًا لاستقبال الطلبات.',
    };
  }
}
