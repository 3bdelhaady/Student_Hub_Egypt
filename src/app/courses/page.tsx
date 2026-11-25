import { canReadAcademic } from '@/lib/policy';
import { redirect } from 'next/navigation';
import { studentAreaViewer } from '@/lib/session';
import { publicCourses } from '@/modules/content/queries';
import { CourseCard, Empty } from '@/components/ui';
import { Search } from 'lucide-react';
import { CourseSelection } from '@/components/course-selection';
import { savedCourseNavigation } from '@/modules/learning/queries';
export const metadata = { title: 'المقررات الدراسية' };
export default async function Courses({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; view?: string; course?: string }>;
}) {
  const v = await studentAreaViewer();
  const params = await searchParams;
  const all = await publicCourses();
  if (v && params.view === 'manage') {
    const saved = await savedCourseNavigation(v.user.id);
    const returnHref = all.some((course) => course.id === params.course)
      ? `/courses/${params.course}`
      : '/courses';
    return (
      <CourseSelection
        courses={all}
        initialIds={saved.map((course) => course.id)}
        returnHref={returnHref}
      />
    );
  }
  if (v && !params.q && !params.category && params.view !== 'catalog') {
    const saved = await savedCourseNavigation(v.user.id);
    const selected =
      all.find((c) => c.id === params.course) ||
      all.find((c) => c.id === saved[0]?.id) ||
      all.find((c) => canReadAcademic(v.membership, c.universityId)) ||
      all[0];
    if (selected) redirect('/courses/' + selected.id);
  }
  const q = (params.q || '').slice(0, 120);
  const filtered = all.filter(
    (c) =>
      (!q || `${c.title} ${c.code} ${c.instructor} ${c.description}`.includes(q)) &&
      (!params.category || c.category === params.category),
  );
  return (
    <>
      <div className="page-top">
        <div className="container">
          <span className="eyebrow">مساحتك الأكاديمية</span>
          <h1>معرفة منظمة، بداية أوضح.</h1>
          <p>استكشف المقررات، ثم ادخل بحساب مفعّل للوصول إلى المحاضرات والموارد.</p>
        </div>
      </div>
      <section className="section container">
        <form className="filter-bar">
          <div className="search-input">
            <Search size={19} />
            <input
              name="q"
              defaultValue={q}
              aria-label="ابحث عن مقرر"
              placeholder="ابحث عن مقرر أو موضوع…"
              maxLength={120}
            />
          </div>
          <select name="category" defaultValue={params.category || ''} aria-label="التصنيف">
            <option value="">كل التصنيفات</option>
            {[...new Set(all.map((c) => c.category))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button className="button primary" type="submit">
            بحث
          </button>
          <a href="/courses" className="text-link">
            مسح
          </a>
        </form>
        <p className="result-count">{filtered.length} مقررات متاحة</p>
        {filtered.length ? (
          <div className="three-grid">
            {filtered.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <Empty
            title="لا توجد نتائج حاليًا."
            body="جرّب كلمة أخرى أو امسح الفلاتر لاستكشاف كل المقررات."
            href="/courses"
            label="كل المقررات"
          />
        )}
      </section>
    </>
  );
}
