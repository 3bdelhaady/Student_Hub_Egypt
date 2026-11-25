import { notFound } from 'next/navigation';
import { desc } from 'drizzle-orm';
import { PlatformConsoleFrame } from '@/components/platform-console-frame';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import { guestMessages } from '@/db/schema';
import { setGuestMessageStatus } from '@/modules/portal/guest-messages';
export const metadata = { title: 'رسائل الزوار' };
const labels: Record<string, string> = { new: 'جديدة', read: 'تمت القراءة', archived: 'مؤرشفة' };
export default async function GuestMessages() {
  const v = await requireViewer();
  if (!v.platformAdmin) notFound();
  const rows = await db
    .select()
    .from(guestMessages)
    .orderBy(desc(guestMessages.createdAt))
    .limit(200);
  const open = rows.filter((r) => r.status === 'new').length;
  return (
    <PlatformConsoleFrame
      inbox
      title="رسائل الزوار"
      description="رسائل من زوار لم يسجلوا بعد، الرد يكون من بريدك على بريد الزائر"
      total={rows.length}
      active={open}
    >
      <section className="panel console-inbox">
        <p>آخر 200 رسالة، الأحدث أولًا.</p>
        <div className="request-list">
          {rows.map((r) => (
            <article className="request-row guest-message" key={r.id}>
              <div>
                <small>
                  {r.name} ·{' '}
                  <a href={'mailto:' + r.email} dir="ltr">
                    {r.email}
                  </a>{' '}
                  · {r.createdAt.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}
                </small>
                <h2>{r.subject}</h2>
                <p style={{ whiteSpace: 'pre-wrap' }}>{r.body}</p>
                <form action={setGuestMessageStatus} className="guest-message-actions">
                  <input type="hidden" name="id" value={r.id} />
                  {r.status !== 'read' && (
                    <button className="button secondary" name="status" value="read">
                      تمت القراءة
                    </button>
                  )}
                  {r.status !== 'archived' && (
                    <button className="button secondary" name="status" value="archived">
                      أرشفة
                    </button>
                  )}
                  {r.status !== 'new' && (
                    <button className="button secondary" name="status" value="new">
                      إرجاع كجديدة
                    </button>
                  )}
                </form>
              </div>
              <span
                className={'status-pill status-' + (r.status === 'new' ? 'pending' : 'completed')}
              >
                {labels[r.status]}
              </span>
            </article>
          ))}
        </div>
        {!rows.length && <p>لا توجد رسائل من الزوار بعد.</p>}
      </section>
    </PlatformConsoleFrame>
  );
}
