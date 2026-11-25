import Link from 'next/link';
import { studentSupportRecipients } from '@/modules/portal/support';
import { studentLoginPath } from '@/modules/shared/return-path';
import { faqItems } from '@/lib/faq';
import { LifeBuoy, MessageCircle, ClipboardList, ShieldCheck, Search } from 'lucide-react';
import { RequestForm } from '@/components/portal-forms';
import { viewer } from '@/lib/session';
import { LandingContact } from '@/components/landing-contact';
export const metadata = { title: 'التواصل والدعم' };
export default async function Help({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; topic?: string }>;
}) {
  const v = await viewer(),
    { q, topic } = await searchParams;
  if (!v)
    return (
      <LandingContact
        identity={null}
        publicSupport
        initialIssue={topic === 'privacy' ? 'الخصوصية والبيانات' : undefined}
      />
    );
  const rows = faqItems.filter((x) => !q || (x.question + ' ' + x.answer).includes(q));
  return (
    <section className="portal-screen help-screen">
      <div className="portal-hero">
        <span className="tag">مركز المساعدة</span>
        <h1>كيف يمكننا مساعدتك؟</h1>
        <p>ابحث عن إجابتك أو تواصل مع فريق إدارة المنصة.</p>
        <LifeBuoy className="portal-hero-icon" size={140} />
        <form action="/help" className="portal-search">
          <Search size={18} />
          <input
            name="q"
            aria-label="ابحث في الأسئلة الشائعة"
            placeholder="اكتب سؤالك هنا..."
            defaultValue={q}
            maxLength={100}
          />
          <button className="button primary">بحث</button>
        </form>
      </div>
      <div className="portal-kind-grid help-categories">
        <Link href="#contact">
          <MessageCircle />
          تواصل معنا
        </Link>
        <Link href="/requests">
          <ClipboardList />
          متابعة طلباتي
        </Link>
        <Link href="/privacy">
          <ShieldCheck />
          الخصوصية والأمان
        </Link>
      </div>
      <div className="portal-detail-grid">
        <section className="portal-form-section">
          <h2>الأسئلة الشائعة</h2>
          <div className="help-faq">
            {rows.map((x) => (
              <details key={x.question}>
                <summary>{x.question}</summary>
                <p>{x.answer}</p>
              </details>
            ))}
            {!rows.length && <p>لم نجد إجابة مطابقة، جرّب كلمات أخرى أو أرسل تذكرة دعم.</p>}
          </div>
        </section>
        <section className="portal-form-section" id="contact">
          <span className="eyebrow">نحن هنا للمساعدة</span>
          <h2>تواصل مع الدعم الفني</h2>
          <p>اختر الجهة التي تستقبل رسالتك وتابع الرد من حسابك.</p>
          {v ? (
            <RequestForm
              recipients={await studentSupportRecipients(v)}
              subject={
                topic === 'membership'
                  ? 'طلب مراجعة بيانات الجامعة أو الكلية'
                  : topic === 'activation'
                    ? 'متابعة تفعيل العضوية الجامعية'
                    : topic === 'privacy'
                      ? 'استفسار حول الخصوصية والبيانات'
                      : undefined
              }
            />
          ) : (
            <Link
              href={studentLoginPath(
                '/help' +
                  (topic === 'membership' || topic === 'activation' ? '?topic=' + topic : '') +
                  '#contact',
              )}
              className="button primary"
            >
              سجّل الدخول لإرسال تذكرة
            </Link>
          )}
        </section>
      </div>
    </section>
  );
}
