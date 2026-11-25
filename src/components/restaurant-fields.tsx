'use client';
import { useState } from 'react';
import { restaurantDetails, type RestaurantDetails } from '@/modules/portal/restaurants';
export function RestaurantFields({
  value,
  compact = false,
}: {
  value?: unknown;
  compact?: boolean;
}) {
  const r = restaurantDetails(value),
    [menu, setMenu] = useState(r.menu);
  function patch(id: string, change: Partial<RestaurantDetails['menu'][number]>) {
    setMenu(menu.map((i) => (i.id === id ? { ...i, ...change } : i)));
  }
  return (
    <fieldset className="portal-form-section">
      <legend>قائمة الطعام</legend>
      <input type="hidden" name="restaurantMenu" value={JSON.stringify(menu)} />
      <div className={compact ? 'commerce-menu-editors' : ''}>
        {menu.map((item, index) => (
          <section className="restaurant-menu-editor" key={item.id}>
            <h3>الصنف {index + 1}</h3>
            <div className="portal-form-grid">
              <label>
                اسم الصنف
                <input
                  value={item.title}
                  required
                  minLength={2}
                  maxLength={120}
                  onChange={(e) => patch(item.id, { title: e.target.value })}
                />
              </label>
              <label>
                قسم القائمة
                <input
                  value={item.category}
                  maxLength={80}
                  onChange={(e) => patch(item.id, { category: e.target.value })}
                />
              </label>
              <label>
                السعر بالجنيه
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step=".01"
                  value={item.priceMinor / 100}
                  onChange={(e) =>
                    patch(item.id, { priceMinor: Math.round(Number(e.target.value) * 100) })
                  }
                />
              </label>
              <label>
                رابط صورة الصنف
                <input
                  type="url"
                  value={item.imageUrl}
                  maxLength={1500}
                  onChange={(e) => patch(item.id, { imageUrl: e.target.value })}
                />
              </label>
            </div>
            <label>
              وصف الصنف
              <textarea
                value={item.description}
                maxLength={1000}
                onChange={(e) => patch(item.id, { description: e.target.value })}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={item.available}
                onChange={(e) => patch(item.id, { available: e.target.checked })}
              />
              متاح للطلب
            </label>
            <button
              type="button"
              className="button secondary"
              onClick={() => setMenu(menu.filter((i) => i.id !== item.id))}
            >
              حذف الصنف
            </button>
          </section>
        ))}
      </div>
      <button
        type="button"
        className="button secondary"
        disabled={menu.length >= 100}
        onClick={() =>
          setMenu([
            ...menu,
            {
              id: crypto.randomUUID(),
              title: '',
              description: '',
              category: '',
              priceMinor: 0,
              imageUrl: '',
              available: true,
            },
          ])
        }
      >
        إضافة صنف للقائمة
      </button>
    </fieldset>
  );
}
