'use client';
import { studentReturnPath } from '@/modules/shared/return-path';
import { createAuthClient } from 'better-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { type UniversityOption, type FacultyOption } from './academic-selects';
import { SignupScopeSelects, type SignupInstitution } from './signup-scope-selects';
import type { SignupKind } from '@/modules/identity/signup-policy';
import { requestAgentRegistration } from '@/modules/identity/registration';
import { joinUniversity } from '@/modules/membership/actions';
import { ArrowLeft, LogIn, Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';
const client = createAuthClient();
export function AuthForm({
  mode,
  next,
  universities = [],
  faculties = [],
  institutions = [],
  emailSecurity = false,
}: {
  mode: 'login' | 'register';
  emailSecurity?: boolean;
  next?: string;
  universities?: UniversityOption[];
  faculties?: FacultyOption[];
  institutions?: SignupInstitution[];
}) {
  const [accountType, setAccountType] = useState<SignupKind>('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const router = useRouter();
  const register = mode === 'register';
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const data = new FormData(e.currentTarget);
    if (register && data.get('password') !== data.get('confirmPassword')) {
      setError('كلمتا المرور غير متطابقتين.');
      setBusy(false);
      return;
    }
    try {
      const result = register
        ? await client.signUp.email(
            {
              name: String(data.get('name')),
              email: String(data.get('email')),
              password: String(data.get('password')),
              callbackURL: accountType === 'student' ? '/account' : '/registration',
            },
            { body: { signupGender: String(data.get('gender') || ''), accountType } },
          )
        : await client.signIn.email({
            email: String(data.get('email')),
            password: String(data.get('password')),
          });
      if (result.error) {
        if (emailSecurity && result.error.code === 'EMAIL_NOT_VERIFIED') {
          router.push('/verify-email');
          return;
        }
        setError(
          register
            ? 'تعذر إنشاء الحساب، تحقق من البيانات أو جرّب تسجيل الدخول إذا كان لديك حساب.'
            : 'تعذر تسجيل الدخول، راجع البريد وكلمة المرور أو انتظر قليلًا ثم حاول.',
        );
      } else {
        if (register && emailSecurity) {
          router.push('/verify-email');
          router.refresh();
          return;
        }
        const membership = register
          ? await (accountType === 'student' ? joinUniversity : requestAgentRegistration)({}, data)
          : undefined;
        router.push(
          membership?.error
            ? accountType === 'student'
              ? '/account?membershipIssue=1'
              : '/registration'
            : register && accountType !== 'student'
              ? '/agent'
              : studentReturnPath(next, '/account?landing=1'),
        );
        router.refresh();
      }
    } catch {
      setError('تعذر الاتصال بالخدمة، حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form onSubmit={submit} className={`form-stack ${register ? 'auth-register-form' : ''}`}>
        {register && (
          <label>
            نوع الحساب
            <select
              name="accountType"
              aria-label="نوع الحساب"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as SignupKind)}
            >
              <option value="student_affairs">وكيل شؤون الطلاب</option>
              <option value="student">طالب (Student)</option>
              <option value="private_sector">وكيل قطاع خاص</option>
            </select>
            <span className="form-hint">
              لإنشاء مؤسسة أو جامعة جديدة يرجى التواصل مع فريق الدعم الفني
            </span>
          </label>
        )}
        {register && (
          <label>
            اسمك
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="الاسم الكامل"
            />
          </label>
        )}
        {register && (
          <label>
            النوع
            <select name="gender" required={accountType === 'student'} defaultValue="">
              <option value="">
                {accountType === 'student' ? 'اختر النوع' : 'غير محدد (اختياري)'}
              </option>
              <option value="male">ولد</option>
              <option value="female">بنت</option>
            </select>
            <span className="form-hint">يُولد الموقع كودًا ثابتًا لحسابك، ولا يُطلب الرقم القومي.</span>
          </label>
        )}
        <label>
          البريد الإلكتروني الجامعي
          <span className="auth-input-icon">
            <Mail size={18} />
            <input
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="example@gmail.com"
            />
          </span>
        </label>
        <label>
          <span className="auth-label-row">
            كلمة المرور
            {!register &&
              (emailSecurity ? (
                <Link href="/forgot-password" className="auth-recovery-note">
                  نسيت كلمة المرور؟
                </Link>
              ) : (
                <span className="auth-recovery-note">الاستعادة غير مفعلة</span>
              ))}
          </span>
          <span className="password-field">
            <LockKeyhole className="auth-lock" size={18} />
            <input
              name="password"
              type={show ? 'text' : 'password'}
              dir="ltr"
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              minLength={register ? 12 : 1}
              maxLength={128}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {register && (
            <span className="form-hint">١٢ حرفًا على الأقل، استخدم كلمة مرور فريدة لحسابك.</span>
          )}
        </label>
        {register && (
          <label>
            تأكيد كلمة المرور
            <span className="password-field">
              <LockKeyhole className="auth-lock" size={18} />
              <input
                name="confirmPassword"
                type={show ? 'text' : 'password'}
                dir="ltr"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
              />
            </span>
          </label>
        )}
        {register && (
          <SignupScopeSelects
            key={accountType}
            kind={accountType}
            universities={universities}
            faculties={faculties}
            institutions={institutions}
          />
        )}
        {register && (
          <label className="checkbox">
            <input type="checkbox" required />
            <span>
              أوافق على{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                سياسة الخصوصية
              </Link>{' '}
              واستخدام المنصة.
            </span>
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button primary" disabled={busy}>
          {busy ? 'لحظة واحدة…' : register ? 'إنشاء حساب' : 'دخول المنصة'}
          {register ? <ArrowLeft size={18} /> : <LogIn size={18} />}
        </button>
      </form>
      <div className="auth-switch">
        {register ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}{' '}
        <Link
          href={
            (register ? '/login' : '/register') +
            (next ? '?next=' + encodeURIComponent(studentReturnPath(next)) : '')
          }
        >
          {register ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
        </Link>
      </div>
      <details className="auth-privacy">
        <summary>الخصوصية وأمان الحساب</summary>
        <p>
          تُراجع طلبات العضوية والصلاحيات بواسطة مسؤول المجتمع.{' '}
          <Link href="/privacy" className="text-link">
            تفاصيل الخصوصية
          </Link>
        </p>
      </details>
    </>
  );
}
