import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';

export function AuthScreen({
  children,
  register = false,
  title,
}: {
  children: React.ReactNode;
  register?: boolean;
  title?: string;
}) {
  return (
    <section className={`figma-auth-screen ${register ? 'is-register' : 'is-login'}`}>
      <header className="auth-topbar">
        <Link className="auth-wordmark" href="/">
          مركز الطلاب
        </Link>
        <Link className="auth-back" href="/">
          <ArrowRight size={15} /> العودة للرئيسية
        </Link>
      </header>
      <div className="auth-canvas">
        {!register && (
          <div className="auth-welcome">
            <h1 lang="en" dir="ltr">
              Student Hub
            </h1>
            <p>مرحبًا بك مجددًا في بوابتك الأكاديمية</p>
          </div>
        )}
        <div className="figma-auth-card">
          {register ? (
            <>
              <span className="auth-cap">
                <GraduationCap size={26} />
              </span>
              <h1>إنشاء حساب جديد</h1>
              <p className="auth-intro">أدخل تفاصيل بياناتك للبدء في استخدام منصة مركز الطلاب</p>
            </>
          ) : (
            <h2 className="auth-card-title">{title || 'تسجيل الدخول'}</h2>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
