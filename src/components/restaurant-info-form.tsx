'use client';
import { useActionState } from 'react';
import { restaurantDetails } from '@/modules/portal/restaurants';
import { saveRestaurantInfo } from '@/modules/portal/restaurant-admin';
export function RestaurantInfoForm({
  entry,
}: {
  entry: { id: string; location: string; restaurantDetails: unknown };
}) {
  const r = restaurantDetails(entry.restaurantDetails);
  const [state, action, pending] = useActionState(saveRestaurantInfo, {});
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={entry.id} />
      <div className="portal-form-grid">
        <label>
          التوصيل
          <select name="delivery" defaultValue={r.delivery}>
            <option value="">لم يحدد</option>
            <option value="yes">متاح</option>
            <option value="no">غير متاح</option>
          </select>
        </label>
        <label>
          موعد الفتح
          <input name="opensAt" type="time" defaultValue={r.opensAt} />
        </label>
        <label>
          موعد الإغلاق
          <input name="closesAt" type="time" defaultValue={r.closesAt} />
        </label>
        <label>
          هاتف التواصل
          <input name="phone" defaultValue={r.phone} maxLength={30} />
        </label>
        <label>
          الموقع
          <input name="location" defaultValue={entry.location} maxLength={300} />
        </label>
        <label>
          رابط موقع المطعم
          <input name="mapUrl" type="url" defaultValue={r.mapUrl} maxLength={1500} />
        </label>
        <label>
          رابط الموقع الإلكتروني
          <input name="website" type="url" defaultValue={r.website} maxLength={1500} />
        </label>
      </div>
      {r.hours && !r.opensAt && <p>المواعيد المحفوظة سابقًا: {r.hours}</p>}
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
      <button disabled={pending} className="button primary">
        حفظ بيانات المطعم
      </button>
    </form>
  );
}
