import Link from 'next/link';
import { Building2, Users, Network, LogOut, Inbox } from 'lucide-react';
import { signOut } from '@/modules/identity/actions';
export function PlatformConsoleFrame({
  title,
  description,
  total,
  active,
  children,
  inbox = false,
}: {
  title: string;
  description: string;
  total: number;
  active: number;
  children: React.ReactNode;
  inbox?: boolean;
}) {
  return (
    <div className="platform-console">
      <header className="console-header">
        <div className="console-header-inner">
          <div>
            <span className="console-kicker">ADMIN PANEL</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="console-metrics">
            <div>
              <strong>{total}</strong>
              <span>{inbox ? 'إجمالي الرسائل' : 'إجمالي السجلات'}</span>
            </div>
            <div>
              <strong>{active}</strong>
              <span>{inbox ? 'قيد المتابعة' : 'نشط'}</span>
            </div>
            <div>
              <strong>{total - active}</strong>
              <span>{inbox ? 'منتهية' : 'غير نشط'}</span>
            </div>
          </div>
        </div>
      </header>
      <section className="console-body">
        <nav className="console-navigation" aria-label="إدارة المنصة">
          <Link href="/admin?tab=institutions">
            <Building2 size={17} />
            المؤسسات
          </Link>
          <Link href="/admin?tab=organizations">
            <Network size={17} />
            الاتحادات والأنشطة
          </Link>
          <Link href="/admin?tab=students">
            <Users size={17} />
            الطلاب
          </Link>
          <Link href="/admin?tab=agents">
            <Users size={17} />
            الوكلاء والصلاحيات
          </Link>
          <Link href="/manage/support">
            <Inbox size={17} />
            صندوق الواردات
          </Link>
          <Link href="/manage/guest-messages">
            <Inbox size={17} />
            رسائل الزوار
          </Link>
          <form action={signOut}>
            <button className="nav-logout" type="submit">
              <LogOut size={17} />
              تسجيل الخروج
            </button>
          </form>
        </nav>
        <div>{children}</div>
      </section>
    </div>
  );
}
