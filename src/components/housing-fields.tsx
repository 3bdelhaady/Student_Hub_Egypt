'use client';
import type { HousingDetails } from '@/modules/portal/housing';
import { housingTypes, housingAudiences, housingDetails } from '@/modules/portal/housing';
export function HousingFields({
  value,
  compact = false,
}: {
  value?: HousingDetails | unknown;
  compact?: boolean;
}) {
  const h = housingDetails(value);
  return (
    <fieldset className="portal-form-section">
      <legend>تفاصيل السكن</legend>
      <div className="portal-form-grid">
        <label>
          نوع السكن
          <select name="housingType" defaultValue={h.type}>
            <option value="">لم يحدد</option>
            {Object.entries(housingTypes).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          السكن مخصص لـ
          <select name="housingAudience" defaultValue={h.audience}>
            <option value="">لم يحدد</option>
            {Object.entries(housingAudiences).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ['Rooms', 'عدد الغرف', h.rooms],
            ['Beds', 'عدد الأسرّة', h.beds],
            ['Residents', 'عدد المقيمين', h.residents],
          ] as const
        ).map(([key, label, v]) => (
          <label key={key}>
            {label}
            <input
              name={'housing' + key}
              type="number"
              min="0"
              max="10000"
              defaultValue={v ?? ''}
            />
          </label>
        ))}
        {(
          [
            ['Furnished', 'مفروش', h.furnished],
            ['Cooling', 'تكييف', h.cooling],
          ] as const
        ).map(([key, label, v]) => (
          <label key={key}>
            {label}
            <select name={'housing' + key} defaultValue={v}>
              <option value="">لم يحدد</option>
              <option value="yes">نعم</option>
              <option value="no">لا</option>
            </select>
          </label>
        ))}
        <label>
          التأمين بالجنيه
          <input
            type="number"
            name="housingDeposit"
            defaultValue={h.deposit}
            min="0"
            max="1000000"
            step="0.01"
          />
        </label>
        <label>
          رسوم الخدمة بالجنيه
          <input
            type="number"
            name="housingServiceFee"
            defaultValue={h.serviceFee}
            min="0"
            max="1000000"
            step="0.01"
          />
        </label>
      </div>
      {!compact && (
        <p className="form-hint">
          السعر الأساسي هو الإيجار الشهري، يُعرض التأمين ورسوم الخدمة منفصلين.
        </p>
      )}
      <div className="portal-form-grid">
        {(
          [
            ['Water', 'مياه شرب', h.water],
            ['Gas', 'غاز طبيعي', h.gas],
            ['Electricity', 'كهرباء', h.electricity],
            ['Wifi', 'واي فاي', h.wifi],
          ] as const
        ).map(([key, label, v]) => (
          <label className="checkbox" key={key}>
            <input type="checkbox" name={'housing' + key} defaultChecked={v} />
            {label}
          </label>
        ))}
      </div>
      <label>
        رابط موقع السكن، اختياري
        <input name="housingMapUrl" type="url" maxLength={1500} dir="ltr" defaultValue={h.mapUrl} />
      </label>
      {!compact && (
        <>
          <label>
            صور إضافية، رابط HTTPS في كل سطر
            <textarea name="housingGallery" rows={4} defaultValue={h.gallery.join('\n')} />
          </label>
        </>
      )}
    </fieldset>
  );
}
