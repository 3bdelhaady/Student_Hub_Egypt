import { requireViewer } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/db';
import { portalEntries, institutions } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import Link from 'next/link';
export default async function Restaurants({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const v = await requireViewer();
  if (!v.platformAdmin) notFound();
  const p = await searchParams;
  const rows = await db
    .select({ entry: portalEntries, institution: institutions.name })
    .from(portalEntries)
    .innerJoin(institutions, eq(institutions.id, portalEntries.institutionId))
    .where(and(eq(portalEntries.kind, 'restaurant'), eq(portalEntries.archived, false)))
    .orderBy(asc(institutions.name), asc(portalEntries.title));
  const selected = rows.find((r) => r.entry.id === p.edit);
  if (p.edit && !selected) notFound();
  if (selected)
    redirect(`/admin?tab=institutions&edit=${encodeURIComponent(selected.entry.institutionId)}`);
  return (
    <section className="section container">
      <h1>إدارة بيانات المطاعم</h1>
      <Link href="/admin">العودة للإدارة</Link>

      <div className="portal-kind-grid">
        {rows.map((r) => (
          <Link
            key={r.entry.id}
            href={'/admin?tab=institutions&edit=' + encodeURIComponent(r.entry.institutionId)}
          >
            {r.entry.title} · {r.institution}
          </Link>
        ))}
      </div>
    </section>
  );
}
