import { notFound } from 'next/navigation';
import { db } from '@/db';
import { socialPosts, user } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { activeEntryScope } from '@/modules/portal/queries';
import { socialAccess, socialChannels, socialStates } from '@/modules/social/policy';
import { SocialMediaPreview } from '@/components/social-media-preview';
import { SocialPostForm } from '@/components/social-post-form';
import { cairoInput } from '@/modules/shared/datetime';
export const metadata = { title: 'إدارة قنوات التواصل' };
export default async function Social() {
  const v = await requireViewer('/manage/social'),
    a = v.institutionAgent;
  if (!a || !isAgentMode(v) || !socialAccess(a, await activeEntryScope(a))) notFound();
  const affairs = a.department === 'student_affairs',
    edit = socialAccess(a, true, true);
  const posts = await db
    .select({ post: socialPosts, name: user.name })
    .from(socialPosts)
    .innerJoin(user, eq(user.id, socialPosts.authorId))
    .where(
      and(
        eq(socialPosts.institutionId, a.institutionId),
        eq(socialPosts.universityId, a.universityId!),
        eq(socialPosts.facultyId, a.facultyId!),
        affairs ? undefined : eq(socialPosts.authorId, v.user.id),
      ),
    )
    .orderBy(desc(socialPosts.updatedAt))
    .limit(100);
  return (
    <section className="portal-screen">
      <div className="workspace-title">
        <h1>إدارة قنوات التواصل</h1>
        <p>منشورات الكلية والجامعة، بمراجعة شؤون الطلاب.</p>
      </div>
      <div className="notice">
        <p>
          القنوات الرسمية غير مرتبطة حاليًا، القبول والجدولة وزر النشر يحفظون الحالة داخل المنصة فقط،
          لا يتم إرسال أي منشور إلى فيسبوك أو إنستغرام أو لينكدإن أو يوتيوب.
        </p>
      </div>
      {!affairs && edit && (
        <section className="portal-form-section">
          <h2>منشور جديد</h2>
          <SocialPostForm />
        </section>
      )}
      <h2>{affairs ? 'طلبات النشر الواردة من Coordinators' : 'منشوراتي ومتابعتها'}</h2>
      {!posts.length && (
        <div className="portal-empty">
          <h3>لا توجد منشورات حتى الآن</h3>
        </div>
      )}
      {posts.map(({ post: p, name }) => (
        <article className="portal-form-section" key={p.id}>
          <h3>
            {socialChannels[p.channel as keyof typeof socialChannels]} ·{' '}
            {p.scope === 'faculty' ? 'قناة الكلية' : 'قناة الجامعة'}
          </h3>
          <p>
            {name} · {socialStates[p.status]}
          </p>
          {p.scheduledAt && (
            <p>
              الموعد الداخلي: {p.scheduledAt.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}،
              لا يوجد نشر تلقائي.
            </p>
          )}
          {affairs && edit ? (
            <SocialPostForm
              post={{
                ...p,
                revision: p.updatedAt.toISOString(),
                scheduledAt: cairoInput(p.scheduledAt),
              }}
            />
          ) : (
            <>
              {p.contentType !== 'text' && p.mediaType && (
                <SocialMediaPreview
                  kind={p.contentType}
                  src={`/api/social/media/${p.id}?v=${p.updatedAt.getTime()}`}
                  name={p.mediaName}
                />
              )}
              <p className="prose">{p.body}</p>
              {p.reviewNote && <p>ملاحظة شؤون الطلاب: {p.reviewNote}</p>}
            </>
          )}
        </article>
      ))}
    </section>
  );
}
