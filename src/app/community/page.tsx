import { studentInstitutionScopeSql } from '@/modules/portal/queries';
import { studentAreaViewer } from '@/lib/session';
import Link from 'next/link';
import { publicPosts } from '@/modules/content/queries';
import { PostCard } from '@/components/ui';
import { Newspaper, Search, CalendarDays } from 'lucide-react';
import { PublicCommunity } from '@/components/public-community';
import { listUniversities, listFaculties } from '@/modules/catalog/queries';
import { db } from '@/db';
import { institutionContent, institutions, faculties, studentOrganizations } from '@/db/schema';
import { and, or, eq, isNull, desc } from 'drizzle-orm';
export const metadata = { title: 'النشرات الإخبارية' };
export default async function Community({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string;
    category?: string;
    q?: string;
    tab?: string;
    university?: string;
  }>;
}) {
  const v = await studentAreaViewer();
  const p = await searchParams,
    m = v?.membership;
  const all = await publicPosts();
  if (!v) {
    const [universities, faculties] = await Promise.all([listUniversities(), listFaculties()]);
    return (
      <PublicCommunity posts={all} universities={universities} faculties={faculties} params={p} />
    );
  }
  const items = all.filter(
    (x) =>
      (!p.kind || x.kind === p.kind) &&
      (!p.category || x.category === p.category) &&
      (!p.q || (x.title + ' ' + x.excerpt + ' ' + x.body).includes(p.q)),
  );
  const notices =
    m?.status === 'active'
      ? await db
          .select({ post: institutionContent, institution: institutions.name })
          .from(institutionContent)
          .innerJoin(institutions, eq(institutionContent.institutionId, institutions.id))
          .leftJoin(faculties, eq(institutionContent.facultyId, faculties.id))
          .leftJoin(
            studentOrganizations,
            eq(institutionContent.organizationId, studentOrganizations.id),
          )
          .where(
            and(
              eq(institutionContent.published, true),
              eq(institutions.active, true),
              studentInstitutionScopeSql(m),
              or(isNull(institutionContent.facultyId), eq(faculties.active, true)),
              or(isNull(institutionContent.organizationId), eq(studentOrganizations.active, true)),
              or(
                eq(institutionContent.department, 'private_sector'),
                and(
                  eq(institutionContent.universityId, m.universityId),
                  m.facultyId
                    ? eq(institutionContent.facultyId, m.facultyId)
                    : isNull(institutionContent.facultyId),
                ),
              ),
            ),
          )
          .orderBy(desc(institutionContent.createdAt))
          .limit(100)
      : [];
  return (
    <section className="portal-screen">
      <div className="portal-hero">
        <span className="tag">ابقَ على اطلاع</span>
        <h1>النشرات الإخبارية</h1>
        <p>أخبار المجتمع، الإعلانات والفرص، في مكان واحد.</p>
        <Newspaper className="portal-hero-icon" size={140} />
      </div>
      <nav className="resource-tabs">
        <Link href="/community" aria-current={p.tab !== 'faculty' ? 'page' : undefined}>
          نشرات المجتمع
        </Link>
        <Link href="/community?tab=faculty" aria-current={p.tab === 'faculty' ? 'page' : undefined}>
          إعلانات كليتي
        </Link>
      </nav>
      {p.tab === 'faculty' ? (
        <div className="newsletter-notices">
          {notices.map(({ post: n, institution }) => (
            <article className="portal-form-section" key={n.id}>
              <span className="tag">{institution}</span>
              <h2>{n.title}</h2>
              <p className="prose">{n.body}</p>
              <time>
                <CalendarDays size={15} />
                {n.createdAt.toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}
              </time>
            </article>
          ))}
          {!notices.length && (
            <div className="portal-empty">
              <Newspaper size={42} />
              <h2>لا توجد إعلانات منشورة في نطاقك بعد</h2>
              {!v && (
                <Link href="/login" className="button primary">
                  تسجيل الدخول
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <form className="portal-filters">
            <label>
              البحث
              <input name="q" defaultValue={p.q} placeholder="ابحث في النشرات..." maxLength={100} />
            </label>
            <label>
              نوع النشرة
              <select name="kind" defaultValue={p.kind || ''}>
                <option value="">الكل</option>
                <option value="news">الأخبار والمقالات</option>
                <option value="opportunity">الفرص والمشاركة</option>
              </select>
            </label>
            <label>
              التصنيف
              <select name="category" defaultValue={p.category || ''}>
                <option value="">كل التصنيفات</option>
                {[...new Set(all.map((x) => x.category))].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <button className="button primary">
              <Search size={16} />
              بحث
            </button>
          </form>
          {items.length ? (
            <div className="three-grid">
              {items.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : (
            <div className="portal-empty">
              <Newspaper size={42} />
              <h2>لا توجد نشرات مطابقة</h2>
              <Link href="/community" className="button secondary">
                عرض جميع النشرات
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
