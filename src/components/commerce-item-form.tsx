'use client';
import { useActionState, useState } from 'react';
import { saveCommerceItem } from '@/modules/portal/commerce-edit';
import { ticketTypes, ticketTiers } from '@/modules/portal/tickets';
import { HousingFields } from './housing-fields';
import { RestaurantFields } from './restaurant-fields';
import type { PortalEntry } from '@/modules/portal/queries';
export function CommerceItemForm({ kind, value }: { kind: string; value?: PortalEntry }) {
  const [state, action, pending] = useActionState(saveCommerceItem, {}),
    [files, setFiles] = useState<File[]>([]),
    [error, setError] = useState('');
  const [tiers, setTiers] = useState(ticketTiers(value?.ticketTiers, value?.priceMinor || 0));
  const existing = value?.imageUrls.length
    ? value.imageUrls
    : value?.imageUrl
      ? [value.imageUrl]
      : [];
  const [kept, setKept] = useState(existing);
  return (
    <form
      action={action}
      className={
        'form-stack commerce-item-form ' +
        (['housing', 'restaurant'].includes(kind) ? 'commerce-detailed-form' : '')
      }
    >
      <input type="hidden" name="id" value={value?.id || ''} />
      <input type="hidden" name="kind" value={kind} />
      <label>
        اسم العنصر
        <input name="title" defaultValue={value?.title} minLength={2} maxLength={160} required />
      </label>
      <label>
        الوصف
        <textarea
          name="description"
          defaultValue={value?.description}
          minLength={10}
          maxLength={12000}
          required
          rows={5}
        />
      </label>
      {kind === 'ticket' && (
        <label>
          نوع الفعالية
          <select name="ticketType" defaultValue={value?.ticketType || 'concert'}>
            {Object.entries(ticketTypes).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind !== 'ticket' ? (
        <label>
          السعر بالجنيه المصري
          <input
            name="price"
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            defaultValue={(value?.priceMinor || 0) / 100}
            required
          />
        </label>
      ) : (
        <fieldset>
          <legend>أنواع التذاكر</legend>
          <input type="hidden" name="ticketTiers" value={JSON.stringify(tiers)} />
          {tiers.map((tier, index) => (
            <section className="portal-form-section" key={tier.id}>
              <h3>التذكرة {index + 1}</h3>
              <label>
                اسم نوع التذكرة
                <input
                  aria-label={'اسم نوع التذكرة ' + (index + 1)}
                  value={tier.title}
                  minLength={2}
                  maxLength={120}
                  required
                  onChange={(e) =>
                    setTiers(
                      tiers.map((t, i) => (i === index ? { ...t, title: e.target.value } : t)),
                    )
                  }
                />
              </label>
              <label>
                وصف التذكرة
                <textarea
                  aria-label={'وصف التذكرة ' + (index + 1)}
                  value={tier.description}
                  maxLength={1000}
                  onChange={(e) =>
                    setTiers(
                      tiers.map((t, i) =>
                        i === index ? { ...t, description: e.target.value } : t,
                      ),
                    )
                  }
                />
              </label>
              <label>
                سعر التذكرة بالجنيه المصري
                <input
                  aria-label={'سعر التذكرة ' + (index + 1)}
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  required
                  value={tier.priceMinor / 100}
                  onChange={(e) =>
                    setTiers(
                      tiers.map((t, i) =>
                        i === index
                          ? { ...t, priceMinor: Math.round(Number(e.target.value) * 100) }
                          : t,
                      ),
                    )
                  }
                />
              </label>
              {tiers.length > 1 && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setTiers(tiers.filter((_, i) => i !== index))}
                >
                  حذف نوع التذكرة {index + 1}
                </button>
              )}
            </section>
          ))}
          <button
            type="button"
            className="button secondary"
            disabled={tiers.length >= 20}
            onClick={() =>
              setTiers([
                ...tiers,
                { id: crypto.randomUUID(), title: '', description: '', priceMinor: 0 },
              ])
            }
          >
            إضافة نوع تذكرة آخر
          </button>
        </fieldset>
      )}
      <fieldset>
        <legend>صور العنصر</legend>
        <p className="form-hint">حتى ٥ صور، ٦٠٠ كيلوبايت للصورة، بصيغة JPG أو PNG أو WebP.</p>
        <div className="commerce-image-previews">
          {existing.map((url, i) => (
            <label key={url}>
              <img src={url} alt={'صورة العنصر ' + (i + 1)} />
              <span>
                <input
                  type="checkbox"
                  name="keepImage"
                  value={url}
                  checked={kept.includes(url)}
                  onChange={(e) =>
                    setKept(e.target.checked ? [...kept, url] : kept.filter((x) => x !== url))
                  }
                />
                الاحتفاظ بالصورة
              </span>
            </label>
          ))}
        </div>
        <label className="commerce-upload-control">
          <span>رفع الصور</span>
          <input
            name="images"
            className="commerce-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              if (
                selected.length + kept.length > 5 ||
                selected.some((f) => f.size > 600 * 1024) ||
                selected.reduce((n, f) => n + f.size, 0) > 3 * 1024 * 1024
              ) {
                setError('اختر حتى ٥ صور، بحد أقصى ٦٠٠ كيلوبايت للصورة.');
                e.target.value = '';
                setFiles([]);
              } else {
                setFiles(selected);
                setError('');
              }
            }}
          />
        </label>
        {files.length > 0 && <p>{files.length} صور جديدة جاهزة للرفع</p>}
        {error && <p role="alert">{error}</p>}
      </fieldset>
      {kind === 'housing' && (
        <label>
          الموقع
          <input name="location" defaultValue={value?.location} maxLength={300} />
        </label>
      )}
      {kind === 'housing' && <HousingFields value={value?.housingDetails} compact />}
      {kind === 'restaurant' && <RestaurantFields value={value?.restaurantDetails} compact />}
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
      <button type="submit" className="button primary" disabled={pending || !!error}>
        {pending ? 'جارٍ الحفظ…' : 'حفظ العنصر'}
      </button>
    </form>
  );
}
