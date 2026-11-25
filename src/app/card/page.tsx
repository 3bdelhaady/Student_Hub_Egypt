import Link from 'next/link';
import { CreditCard, PlusCircle, History, CalendarClock } from 'lucide-react';
import { requireStudentViewer } from '@/lib/session';
export const metadata = { title: 'كرت مركز الطلاب' };
export default async function Card() {
  const v = await requireStudentViewer('/card');
  return (
    <section className="profile-screen student-card-screen">
      <div className="workspace-title">
        <span className="eyebrow">حسابي</span>
        <h1>كرت مركز الطلاب</h1>
        <p>رصيدك ومعاملاتك واشتراكاتك في مكان واحد.</p>
      </div>
      <article className="student-payment-card" aria-labelledby="card-balance-title">
        <CreditCard size={36} aria-hidden="true" />
        <h2 id="card-balance-title">الرصيد المتاح</h2>
        <strong>٠٫٠٠ ج.م.</strong>
        <p>{v.user.name}</p>
        <span>Student Hub</span>
      </article>
      <section className="portal-form-section">
        <h2>شحن رصيد</h2>
        <p>
          شحن الرصيد من خلال بوابة الدفع غير متاح حاليًا، لا يمكن الدفع الإلكتروني برصيد غير كافٍ.
        </p>
        <button type="button" className="button secondary" disabled>
          <PlusCircle size={18} />
          شحن رصيد
        </button>
      </section>
      <section className="portal-form-section" aria-labelledby="card-transactions-title">
        <h2 id="card-transactions-title">
          <History size={21} aria-hidden="true" /> المعاملات السابقة
        </h2>
        <p>لا توجد معاملات على الكرت حتى الآن.</p>
        <Link href="/requests" className="text-link">
          متابعة طلبات المتجر
        </Link>
      </section>
      <section className="portal-form-section" aria-labelledby="card-subscriptions-title">
        <h2 id="card-subscriptions-title">
          <CalendarClock size={21} aria-hidden="true" /> الاشتراكات
        </h2>
        <p>لا توجد اشتراكات مرتبطة بالكرت حاليًا.</p>
        <p className="form-hint">
          لا يوجد تجديد تلقائي، عند توفر اشتراك وانتهاء مدته تختار تجديده بنفسك، ولا يتم الخصم دون
          تأكيدك.
        </p>
      </section>
      <Link href="/profile" className="button secondary">
        العودة إلى حسابي
      </Link>
    </section>
  );
}
