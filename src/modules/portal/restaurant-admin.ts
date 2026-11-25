'use server';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import { portalEntries } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { restaurantInput, restaurantDetails } from './restaurants';
import { refresh, type FormState } from '../shared/form-state';
export async function saveRestaurantInfo(_: FormState, f: FormData): Promise<FormState> {
  const v = await requireViewer();
  if (!v.platformAdmin) return { error: 'هذه البيانات متاحة للإدارة فقط.' };
  try {
    const id = String(f.get('id') || '');
    const [e] = await db
      .select()
      .from(portalEntries)
      .where(and(eq(portalEntries.id, id), eq(portalEntries.kind, 'restaurant')))
      .limit(1);
    if (!e) throw Error();
    const old = restaurantDetails(e.restaurantDetails);
    const opensAt = String(f.get('opensAt') || ''),
      closesAt = String(f.get('closesAt') || '');
    if (Boolean(opensAt) !== Boolean(closesAt)) throw Error();
    const details = restaurantInput.parse({
      ...old,
      delivery: f.get('delivery'),
      opensAt,
      closesAt,
      phone: f.get('phone'),
      mapUrl: f.get('mapUrl'),
      website: f.get('website'),
    });
    const location = String(f.get('location') || '').trim();
    if (location.length > 300) throw Error();
    const saved = await db
      .update(portalEntries)
      .set({ restaurantDetails: details, location, updatedAt: new Date() })
      .where(and(eq(portalEntries.id, id), eq(portalEntries.updatedAt, e.updatedAt)))
      .returning({ id: portalEntries.id });
    if (!saved.length) throw Error();
    refresh();
    return { success: 'تم حفظ بيانات المطعم.' };
  } catch {
    return { error: 'تعذر الحفظ. راجع المواعيد والروابط، أو أعد تحميل الصفحة إن تغيرت البيانات.' };
  }
}
