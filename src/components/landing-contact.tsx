'use client';
import Link from 'next/link';
import { LifeBuoy, ClipboardList, ShieldCheck } from 'lucide-react';
import { ActionForm, RequestForm } from './portal-forms';
import { submitGuestMessage } from '@/modules/portal/guest-messages';
export const supportDraftKey = 'student-hub-support-draft';
export function LandingContact({
  identity,
  publicSupport = false,
  initialIssue,
}: {
  identity: { name: string; email: string } | null;
  publicSupport?: boolean;
  initialIssue?: string;
}) {
  const subjectField = (
    <label>
      {publicSupport ? 'نوع المشكلة' : 'الموضوع'}
      {publicSupport ? (
        <select
          name="subject"
          defaultValue={initialIssue ? 'دعم فني: ' + initialIssue : ''}
          required
        >
          <option value="" disabled>
            اختر نوع المشكلة
          </option>
          {[
            'الحساب والعضوية',
            'المقررات والموارد',
            'المتجر والخدمات',
            'الخصوصية والبيانات',
            'مشكلة أخرى',
          ].map((label) => (
            <option key={label} value={'دعم فني: ' + label}>
              {label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name="subject"
          placeholder="كيف يمكننا مساعدتك؟"
          minLength={3}
          maxLength={160}
          required
        />
      )}
    </label>
  );
  const form = identity ? (
    <div className="landing-contact-form">
      <div className="landing-contact-identity">
        <label>
          الاسم
          <input value={identity.name} disabled readOnly autoComplete="name" />
        </label>
        <label>
          البريد الإلكتروني
          <input value={identity.email} disabled readOnly dir="ltr" autoComplete="email" />
        </label>
      </div>
      <RequestForm contact />
    </div>
  ) : (
    <div className="landing-contact-form">
      <ActionForm action={submitGuestMessage} label="إرسال الرسالة">
        <div className="landing-contact-identity">
          <label>
            الاسم
            <input
              name="name"
              placeholder="اكتب اسمك"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </label>
          <label>
            البريد الإلكتروني
            <input
              name="email"
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              autoComplete="email"
              maxLength={160}
              required
            />
          </label>
        </div>
        {subjectField}
        <label>
          {publicSupport ? 'وصف المشكلة' : 'الرسالة'}
          <textarea
            name="body"
            rows={5}
            placeholder="اكتب رسالتك هنا، لا ترسل كلمة مرور أو بيانات دفع."
            minLength={10}
            maxLength={6000}
            required
          />
        </label>
        <div className="guest-honeypot" aria-hidden="true">
          <label>
            الموقع
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <p className="landing-contact-note">اكتب اسمك وبريدك وسنرد عليك على البريد</p>
      </ActionForm>
    </div>
  );
  if (publicSupport)
    return (
      <section className="public-support-page container">
        <header>
          <h1>كيف يمكننا مساعدتك؟</h1>
          <p>اكتب تفاصيل المشكلة مع اسمك وبريدك وسنرد عليك على البريد</p>
        </header>
        {form}
        <p className="public-support-faq">
          <Link href="/faq">الأسئلة الشائعة</Link> · <Link href="/privacy">سياسة الخصوصية</Link>
        </p>
      </section>
    );
  return (
    <section className="landing-contact-section" id="contact">
      <div className="container">
        <div className="landing-contact-grid">
          <div className="landing-contact-copy">
            <h2>تواصل معنا</h2>
            <p>نحن هنا للإجابة على استفساراتك ومساعدتك، أرسل رسالتك وسنرد عليك.</p>
            <div className="landing-contact-routes">
              <Link href="/help">
                <span>
                  <LifeBuoy size={24} />
                </span>
                <div>
                  <strong>الدعم الفني</strong>
                  <small>مساعدة في الحساب واستخدام المنصة</small>
                </div>
              </Link>
              <Link href="/requests">
                <span>
                  <ClipboardList size={24} />
                </span>
                <div>
                  <strong>متابعة الرسائل والطلبات</strong>
                  <small>محادثة خاصة مع المسؤول وحالة كل طلب</small>
                </div>
              </Link>
              <Link href="/privacy">
                <span>
                  <ShieldCheck size={24} />
                </span>
                <div>
                  <strong>الخصوصية والأمان</strong>
                  <small>كيف نحفظ بياناتك ونحمي حسابك</small>
                </div>
              </Link>
            </div>
          </div>
          {form}
        </div>
      </div>
    </section>
  );
}
