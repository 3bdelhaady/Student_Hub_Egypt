import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import { portalNotifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { markNotificationsRead } from '@/modules/portal/actions';
export const metadata = { title: 'الإشعارات' };
export default async function Notifications() {
  const v = await requireViewer('/notifications');
  const rows = await db
    .select()
    .from(portalNotifications)
    .where(eq(portalNotifications.userId, v.user.id))
    .orderBy(desc(portalNotifications.createdAt))
    .limit(100);
  return (
    <section className="portal-screen notifications-screen">
      <div className="section-heading">
        <div>
          <h1>الإشعارات</h1>
          <p>تابع آخر تحديثات طلباتك وخدماتك.</p>
        </div>
        {rows.some((x) => !x.readAt) && (
          <form action={markNotificationsRead}>
            <button className="button secondary">
              <CheckCheck size={17} />
              تحديد الكل كمقروء
            </button>
          </form>
        )}
      </div>
      <div className="notification-list">
        {rows.map((n) => (
          <article className={n.readAt ? '' : 'unread'} key={n.id}>
            <span className="notification-icon">
              <Bell size={20} />
            </span>
            <div>
              <h2>
                <Link href={n.href}>{n.title}</Link>
              </h2>
              <p>{n.body}</p>
              <time>{n.createdAt.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</time>
            </div>
            {!n.readAt && (
              <form action={markNotificationsRead}>
                <input type="hidden" name="id" value={n.id} />
                <button className="text-link">تمت القراءة</button>
              </form>
            )}
          </article>
        ))}
      </div>
      {!rows.length && (
        <div className="portal-empty">
          <Bell size={42} />
          <h2>لا توجد إشعارات جديدة</h2>
          <p>ستجد تحديثات طلباتك هنا.</p>
        </div>
      )}
    </section>
  );
}
