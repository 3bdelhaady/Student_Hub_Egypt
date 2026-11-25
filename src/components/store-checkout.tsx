'use client';
import { ticketTiers, type TicketTier } from '@/modules/portal/tickets';
import { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { Banknote, CreditCard, Wallet, PlusCircle, ShoppingBag } from 'lucide-react';
import { restaurantDetails, type RestaurantDetails } from '@/modules/portal/restaurants';
import { submitStoreOrder } from '@/modules/portal/store-actions';
const currency = (v: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(v / 100);
export function StoreCheckout({
  entry,
  studentFields,
  profileDigest,
  recipientName,
  deposit = 0,
  serviceFee = 0,
  inspection = false,
  restaurant,
  digest,
  tiers: rawTiers,
}: {
  entry: { id: string; title: string; kind: string; priceMinor: number; capacity: number | null };
  studentFields: string[][];
  profileDigest: string;
  recipientName: string;
  deposit?: number;
  serviceFee?: number;
  inspection?: boolean;
  restaurant?: RestaurantDetails;
  digest: string;
  tiers?: TicketTier[];
}) {
  const [method, setMethod] = useState('cash'),
    [quantity, setQuantity] = useState(1),
    [purpose, setPurpose] = useState(inspection ? 'inspection' : 'purchase');
  const tiers = ticketTiers(rawTiers, entry.priceMinor);
  const [tierId, setTierId] = useState(tiers[0].id);
  const selectedTier = tiers.find((t) => t.id === tierId) || tiers[0];
  const [cart, setCart] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      setCart(JSON.parse(sessionStorage.getItem('hub-cart-' + entry.id) || '{}'));
    } catch {}
  }, [entry.id]);
  const items = restaurantDetails(restaurant).menu.filter(
    (i) => i.available && Number.isInteger(cart[i.id]) && cart[i.id] > 0 && cart[i.id] <= 99,
  );
  const restaurantTotal = items.reduce((sum, i) => sum + i.priceMinor * cart[i.id], 0);
  const [state, action, pending] = useActionState(submitStoreOrder, {});
  const total =
    purpose === 'inspection'
      ? 0
      : (restaurant?.menu.length
          ? restaurantTotal
          : (entry.kind === 'ticket' ? selectedTier.priceMinor : entry.priceMinor) * quantity) +
        deposit +
        serviceFee;
  return (
    <form action={action} className="store-checkout">
      <input type="hidden" name="checkoutDigest" value={digest} />
      <input type="hidden" name="profileDigest" value={profileDigest} />
      <input
        type="hidden"
        name="cart"
        value={JSON.stringify(items.map((i) => ({ id: i.id, quantity: cart[i.id] })))}
      />
      <input type="hidden" name="entryId" value={entry.id} />
      <input type="hidden" name="purpose" value={purpose} />
      {entry.kind === 'ticket' && (
        <section className="store-student-summary">
          <label>
            نوع التذكرة
            <select
              aria-label="نوع التذكرة"
              name="ticketTierId"
              value={tierId}
              onChange={(e) => setTierId(e.target.value)}
            >
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}، {currency(t.priceMinor)}
                </option>
              ))}
            </select>
          </label>
          <p>{selectedTier.description}</p>
        </section>
      )}
      <h2>{purpose === 'inspection' ? 'طلب معاينة السكن' : 'طريقة الدفع'}</h2>
      {entry.kind === 'housing' && (
        <div className="store-purpose">
          <button
            className={purpose === 'purchase' ? 'selected' : ''}
            type="button"
            onClick={() => setPurpose('purchase')}
          >
            حجز السكن
          </button>
          <button
            className={purpose === 'inspection' ? 'selected' : ''}
            type="button"
            onClick={() => setPurpose('inspection')}
          >
            طلب معاينة
          </button>
        </div>
      )}
      {purpose === 'purchase' && (
        <>
          <div className="store-payment-options">
            <label className={method === 'cash' ? 'selected' : ''}>
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={method === 'cash'}
                onChange={() => setMethod('cash')}
              />
              <Banknote size={28} />
              <strong>كاش</strong>
              <small>بانتظار تأكيد الناشر</small>
            </label>
            <label className={method === 'electronic' ? 'selected' : ''}>
              <input
                type="radio"
                name="paymentMethod"
                value="electronic"
                checked={method === 'electronic'}
                onChange={() => setMethod('electronic')}
              />
              <CreditCard size={28} />
              <strong>إلكتروني</strong>
              <small>كرت الدفع الخاص بمركز الطلاب</small>
            </label>
          </div>
          {method === 'electronic' ? (
            <div className="store-hub-card">
              <Wallet size={28} />
              <h3>كرت الدفع الخاص بمركز الطلاب</h3>
              <p>الرصيد: {currency(0)}</p>
              <p>الرصيد غير كافٍ، شحن الرصيد غير متاح حاليًا، لم يُخصم أي مبلغ.</p>
              <Link href="/card" className="text-link">
                رصيد الكرت والمعاملات والاشتراكات
              </Link>
              <button type="button" className="button secondary" disabled>
                <PlusCircle size={18} />
                شحن أموال للكرت
              </button>
            </div>
          ) : (
            <p className="store-cash-note">
              تُرسل بياناتك وطلبك إلى {recipientName}، ويظل الطلب بانتظار التأكيد، لا يُخصم أي مبلغ
              عبر الموقع.
            </p>
          )}
        </>
      )}
      <section className="store-student-summary">
        <h3>بيانات الطالب المرسلة للناشر</h3>
        {studentFields.map(([label, value]) => (
          <p key={label}>
            {label}: {value}
          </p>
        ))}
        <Link href="/profile">تعديل بيانات التواصل</Link>
      </section>
      {items.length > 0 && (
        <section className="store-student-summary">
          <h3>محتويات الطلب</h3>
          {items.map((i) => (
            <p key={i.id}>
              {i.title} × {cart[i.id]}
            </p>
          ))}
        </section>
      )}
      {purpose === 'purchase' && !['housing', 'restaurant'].includes(entry.kind) ? (
        <label>
          الكمية
          <input
            name="quantity"
            type="number"
            value={quantity}
            min={1}
            max={Math.min(99, entry.capacity ?? 99)}
            required
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
      ) : (
        <input type="hidden" name="quantity" value="1" />
      )}
      <div className="request-cost">
        <span>{purpose === 'inspection' ? 'طلب معاينة، دون دفع' : 'الإجمالي'}</span>
        <strong>{currency(total)}</strong>
      </div>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {state.success}
          <br />
          <Link href="/requests">متابعة طلباتي</Link>
        </p>
      )}
      <button
        type="submit"
        className="button primary"
        disabled={
          pending ||
          (purpose === 'purchase' && method === 'electronic') ||
          (entry.kind === 'restaurant' && !items.length)
        }
      >
        <ShoppingBag size={18} />
        {pending
          ? 'جارٍ إرسال الطلب'
          : purpose === 'inspection'
            ? 'إرسال طلب المعاينة'
            : 'دفع وإتمام عملية الشراء'}
      </button>
    </form>
  );
}
