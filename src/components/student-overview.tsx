import Link from 'next/link';
import { db } from '@/db';
import { portalRequests, portalNotifications } from '@/db/schema';
import { eq, and, isNull, desc, count } from 'drizzle-orm';
import { requestStatuses } from '@/modules/portal/policy';
import { BookOpen, ClipboardList, Bell, ShoppingBag, LifeBuoy, UserRound } from 'lucide-react';
export async function StudentOverview({ userId }: { userId: string }) {
  const [recent, unread] = await Promise.all([
    db
      .select()
      .from(portalRequests)
      .where(eq(portalRequests.userId, userId))
      .orderBy(desc(portalRequests.updatedAt))
      .limit(3),
    db
      .select({ value: count() })
      .from(portalNotifications)
      .where(and(eq(portalNotifications.userId, userId), isNull(portalNotifications.readAt))),
  ]);
  return (
    <section className="panel student-overview" aria-label="متابعة يومك الجامعي">
      <div className="section-heading">
        <div>
          <span className="eyebrow">كل مساحتك في مكان واحد</span>
          <h2>تابع يومك الجامعي</h2>
        </div>
        <Link href="/notifications" className="button secondary">
          <Bell size={17} />
          الإشعارات{unread[0]?.value ? ` (${unread[0].value})` : ''}
        </Link>
      </div>
      <nav className="student-quick-links" aria-label="روابط الطالب السريعة">
        {[
          { href: '/courses', title: 'مقرراتي', Icon: BookOpen },
          { href: '/requests', title: 'طلباتي', Icon: ClipboardList },
          { href: '/store?saved=1', title: 'محفوظات المتجر', Icon: ShoppingBag },
          { href: '/services', title: 'الخدمات الأساسية', Icon: ClipboardList },
          { href: '/profile', title: 'ملفي الشخصي', Icon: UserRound },
          { href: '/help', title: 'المساعدة', Icon: LifeBuoy },
        ].map(({ href, title, Icon }) => (
          <Link href={href} key={href}>
            <Icon size={21} />
            <span>{title}</span>
          </Link>
        ))}
      </nav>
      <div className="section-heading">
        <h3>آخر تحديثات طلباتك</h3>
        <Link className="text-link" href="/requests">
          كل الطلبات
        </Link>
      </div>
      {recent.length ? (
        <ul className="student-recent-requests">
          {recent.map((r) => (
            <li key={r.id}>
              <Link href={'/requests/' + r.id}>
                <span>
                  {r.subject}
                  <small>{r.reference}</small>
                </span>
                <span className={'status-pill status-' + r.status}>
                  {requestStatuses[r.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="form-hint">
          لا توجد طلبات بعد، عند إرسال طلب خدمة أو تذكرة دعم، تظهر متابعته هنا.
        </p>
      )}
    </section>
  );
}
