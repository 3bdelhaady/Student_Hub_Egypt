'use client';
import { HousingGallery } from './housing-gallery';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coffee, ShoppingCart, Plus, Minus, MapPin, Phone, Globe } from 'lucide-react';
import {
  restaurantDetails,
  restaurantHours,
  type RestaurantDetails,
} from '@/modules/portal/restaurants';
const money = (v: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(v / 100);
export function RestaurantDetail({
  entry,
  signedIn,
}: {
  entry: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    imageUrls?: string[];
    location: string;
    restaurantDetails: RestaurantDetails;
  };
  signedIn: boolean;
}) {
  const r = restaurantDetails(entry.restaurantDetails),
    [category, setCategory] = useState(''),
    [cart, setCart] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('hub-cart-' + entry.id) || '{}');
      if (saved && typeof saved === 'object')
        setCart(
          Object.fromEntries(
            Object.entries(saved).filter(
              ([id, q]) =>
                r.menu.some((i) => i.id === id && i.available) &&
                Number.isInteger(q) &&
                Number(q) > 0 &&
                Number(q) <= 99,
            ),
          ) as Record<string, number>,
        );
    } catch {}
  }, [entry.id]);
  function quantity(id: string, q: number) {
    const next = { ...cart };
    if (q <= 0) delete next[id];
    else next[id] = Math.min(q, 99);
    setCart(next);
    try {
      sessionStorage.setItem('hub-cart-' + entry.id, JSON.stringify(next));
    } catch {}
  }
  const total = r.menu.reduce((sum, i) => sum + i.priceMinor * (cart[i.id] || 0), 0),
    count = Object.values(cart).reduce((a, b) => a + b, 0);
  return (
    <section className="restaurant-screen restaurant-detail-screen">
      <div className="breadcrumbs">
        <Link href="/store?kind=restaurant">المطاعم والكافيهات</Link>
        <span>{entry.title}</span>
      </div>
      <header className="restaurant-cover">
        {r.cover ? (
          <img src={r.cover} alt="كافر المطعم" />
        ) : (entry.imageUrls?.length || 0) > 1 ? (
          <HousingGallery images={entry.imageUrls!} title={entry.title} />
        ) : (
          entry.imageUrl && (
            <img
              src={
                entry.imageUrl.endsWith('/catalog/meal.svg')
                  ? '/design/restaurant-banner.jpg'
                  : entry.imageUrl
              }
              alt=""
            />
          )
        )}
        <div>
          <span className="restaurant-brand-mark">
            {r.logo ? (
              <img
                src={r.logo}
                alt="لوجو المطعم"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Coffee size={35} />
            )}
          </span>
          <h1>{entry.title}</h1>
          <p>{entry.location}</p>
          <span className="tag">{restaurantHours(r) || 'مواعيد العمل غير محددة'}</span>
        </div>
      </header>
      <p className="restaurant-description">{entry.description}</p>
      <div className="restaurant-menu-tabs">
        <button className={!category ? 'selected' : ''} onClick={() => setCategory('')}>
          الكل
        </button>
        {[...new Set(r.menu.map((i) => i.category).filter(Boolean))].map((c) => (
          <button
            key={c}
            className={category === c ? 'selected' : ''}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="restaurant-menu-grid">
        {r.menu
          .filter((i) => !category || i.category === category)
          .map((i) => (
            <article key={i.id} className="restaurant-dish">
              <div className="restaurant-dish-art">
                {i.imageUrl ? (
                  <img
                    src={
                      i.imageUrl.endsWith('/catalog/meal.svg') &&
                      ['chicken-rice', 'pasta', 'juice'].includes(i.id)
                        ? '/design/' +
                          (
                            {
                              'chicken-rice': 'grilled-chicken',
                              pasta: 'pasta',
                              juice: 'juice',
                            } as Record<string, string>
                          )[i.id] +
                          '.jpg'
                        : i.imageUrl.endsWith('/catalog/meal.svg')
                          ? '/catalog/meal.svg'
                          : i.imageUrl
                    }
                    alt={i.title}
                  />
                ) : (
                  <Coffee size={46} />
                )}
              </div>
              <div>
                <div className="restaurant-dish-heading">
                  <h2>{i.title}</h2>
                  <strong>{money(i.priceMinor)}</strong>
                </div>
                <p>{i.description}</p>
                {cart[i.id] ? (
                  <div className="restaurant-quantity">
                    <button
                      aria-label={'تقليل ' + i.title}
                      onClick={() => quantity(i.id, cart[i.id] - 1)}
                    >
                      <Minus size={16} />
                    </button>
                    <span>{cart[i.id]}</span>
                    <button
                      aria-label={'زيادة ' + i.title}
                      onClick={() => quantity(i.id, cart[i.id] + 1)}
                      disabled={cart[i.id] >= 99}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="button secondary"
                    disabled={!i.available}
                    onClick={() => quantity(i.id, 1)}
                  >
                    <ShoppingCart size={16} />
                    {i.available ? 'أضف إلى الطلب' : 'غير متاح حاليًا'}
                  </button>
                )}
              </div>
            </article>
          ))}
      </div>
      {!r.menu.length && (
        <div className="portal-empty">
          <Coffee size={44} />
          <h2>لم يضف الناشر قائمة الطعام بعد</h2>
          <p>ستظهر الأصناف والأسعار هنا عند نشرها.</p>
        </div>
      )}
      <section className="restaurant-location location-preview">
        <MapPin size={27} />
        <h2>موقع المطعم</h2>
        <p>{entry.location || 'لم يحدد الناشر الموقع'}</p>
        {r.mapUrl && (
          <a className="button secondary" href={r.mapUrl} target="_blank" rel="noopener noreferrer">
            عرض موقع المطعم
          </a>
        )}
      </section>
      <section className="restaurant-contact">
        <h2>تواصل معنا</h2>
        {restaurantHours(r) && <p>مواعيد العمل: {restaurantHours(r)}</p>}
        {r.phone && (
          <a href={'tel:' + r.phone}>
            <Phone size={18} />
            {r.phone}
          </a>
        )}
        {r.website && (
          <a href={r.website} target="_blank" rel="noopener noreferrer">
            <Globe size={18} />
            الموقع الإلكتروني
          </a>
        )}
        {r.delivery && <p>{r.delivery === 'yes' ? 'التوصيل متاح' : 'لا يتوفر توصيل'}</p>}
      </section>
      {count > 0 && (
        <Link
          className="restaurant-cart-link"
          href={
            signedIn
              ? '/store/' + entry.id + '/checkout'
              : '/login?next=' + encodeURIComponent('/store/' + entry.id + '/checkout')
          }
        >
          <ShoppingCart size={20} />
          عرض الطلب، {count} أصناف<span>{money(total)}</span>
        </Link>
      )}
    </section>
  );
}
