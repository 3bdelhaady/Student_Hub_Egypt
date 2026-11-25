'use client';
import { createAuthClient } from 'better-auth/react';
import { useState } from 'react';
import Link from 'next/link';
const client = createAuthClient();
export function EmailSecurityForm({
  mode,
  token,
  error,
}: {
  mode: 'verify' | 'forgot' | 'reset';
  token?: string;
  error?: string;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [failed, setFailed] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFailed('');
    const data = new FormData(e.currentTarget);
    try {
      if (mode === 'reset') {
        if (!token || data.get('password') !== data.get('confirmation')) {
          setFailed('راجع تطابق كلمتي المرور وصلاحية الرابط.');
          return;
        }
        const result = await client.resetPassword({
          token,
          newPassword: String(data.get('password')),
        });
        if (result.error) setFailed('انتهت صلاحية الرابط أو تعذر الحفظ. اطلب رابطًا جديدًا.');
        else setMessage('تم تغيير كلمة المرور وتسجيل خروج الجلسات السابقة. يمكنك تسجيل الدخول.');
      } else {
        const email = String(data.get('email'));
        if (mode === 'verify')
          await client.sendVerificationEmail({ email, callbackURL: '/registration' });
        else await client.requestPasswordReset({ email, redirectTo: '/reset-password' });
        setMessage(
          'إذا كان البريد مسجلًا ومؤهلًا، ستصلك رسالة. راجع البريد الوارد والرسائل غير المرغوب فيها.',
        );
      }
    } catch {
      setFailed('تعذر الاتصال بالخدمة، حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {mode === 'verify' && (
        <p>
          افتح رابط التأكيد الذي يصلك على بريدك، ثم سجّل الدخول لاستكمال طلب عضويتك. يمكنك طلب رابط
          آخر أدناه.
        </p>
      )}
      <form className="form-stack" onSubmit={submit}>
        {mode === 'reset' ? (
          <>
            <label>
              كلمة المرور الجديدة
              <input
                name="password"
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              تأكيد كلمة المرور
              <input
                name="confirmation"
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </label>
          </>
        ) : (
          <label>
            البريد الإلكتروني
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              dir="ltr"
            />
          </label>
        )}
        {(failed || error) && (
          <p role="alert" className="form-error">
            {failed || 'الرابط غير صالح أو انتهت صلاحيته.'}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <button
          className="button primary"
          disabled={busy || (mode === 'reset' && (!token || !!message))}
        >
          {busy ? 'لحظة واحدة…' : mode === 'reset' ? 'حفظ كلمة المرور' : 'إرسال الرابط'}
        </button>
      </form>
      <p>
        <Link href="/login">تسجيل الدخول</Link> ·{' '}
        <Link href="/forgot-password">طلب رابط استرجاع جديد</Link>
      </p>
    </>
  );
}
