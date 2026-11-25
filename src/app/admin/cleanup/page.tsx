import { requireViewer } from '@/lib/session';
import { notFound } from 'next/navigation';
import { cleanupPreview } from '@/modules/institution/requested-cleanup';
import { CleanupForm } from './form';
import Link from 'next/link';
export const metadata = { title: 'مراجعة التنظيف المحدد' };
export default async function Cleanup() {
  const v = await requireViewer();
  if (!v.platformAdmin) notFound();
  const p = await cleanupPreview();
  return (
    <section className="section container">
      <h1>مراجعة التنظيف المحدد</h1>
      <Link href="/admin?tab=students">العودة للإدارة</Link>
      {p.done ? (
        <p role="status">اكتمل التنظيف المطلوب. لا توجد قاعدة حذف تلقائي للحسابات الجديدة.</p>
      ) : (
        <>
          <h2>الحسابات المحفوظة ({p.keepAccounts.length})</h2>
          <ul>
            {p.keepAccounts.map((a) => (
              <li key={a.id}>{a.email}</li>
            ))}
          </ul>
          <h2>الحسابات المطلوب حذفها ({p.remove.length})</h2>
          <ul>
            {p.remove.map((a) => (
              <li key={a.id}>{a.email}</li>
            ))}
          </ul>
          <h2>مؤسسات غير مستخدمة تحذف من العرض</h2>
          <ul>
            {p.removeInstitutions.map((i) => (
              <li key={i.id}>{i.name}</li>
            ))}
          </ul>
          <h2>المؤسسات المحفوظة</h2>
          <ul>
            {p.keepInstitutions.map((i) => (
              <li key={i.id}>
                {i.name}:{' '}
                {i.kind === 'university'
                  ? 'جامعة محفوظة'
                  : Number(i.kept_agents)
                    ? 'مرتبطة بحساب محفوظ'
                    : 'تدعم محتوى قائمًا'}
              </li>
            ))}
          </ul>
          <CleanupForm digest={p.digest} />
        </>
      )}
    </section>
  );
}
