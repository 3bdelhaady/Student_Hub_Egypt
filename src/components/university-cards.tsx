import Link from 'next/link';
import { ArrowLeft, GraduationCap, Plus } from 'lucide-react';

type University = { id: string; name: string; city: string };
type Counts = { universityId: string }[];
export function UniversityCards({
  universities,
  faculties,
  courses,
  compact = false,
}: {
  universities: University[];
  faculties: Counts;
  courses: Counts;
  compact?: boolean;
}) {
  const shown = compact ? universities.slice(0, 4) : universities;
  return (
    <div
      data-count={shown.length}
      className={compact ? 'home-university-grid' : 'university-directory-grid'}
    >
      {shown.map((university, index) => (
        <article
          className={`home-university-card ${compact && index === 0 ? 'is-featured' : ''}`}
          key={university.id}
        >
          <div className="home-university-top">
            <span className="home-university-symbol" aria-hidden="true">
              <GraduationCap size={compact && index === 0 ? 42 : 28} />
            </span>
            <div>
              {compact && index === 0 && <span className="eyebrow">من دليل الجامعات</span>}
              <h3>{university.name}</h3>
              <p>{university.city}</p>
            </div>
          </div>
          <p className="home-university-summary">
            استكشف الكليات والمقررات المنشورة، وابدأ رحلتك في مجتمعك الجامعي.
          </p>
          <div className="reference-meta">
            <span>
              {faculties.filter((f) => f.universityId === university.id).length} كليات متاحة
            </span>
            <span>
              {courses.filter((c) => c.universityId === university.id).length} مقررات منشورة
            </span>
          </div>
          <Link
            className={compact && index === 0 ? 'button primary' : 'home-university-link'}
            href={`/universities?university=${encodeURIComponent(university.id)}`}
          >
            استكشف الجامعة
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
        </article>
      ))}
      {compact && (
        <Link className="home-university-more" href="/universities">
          <span aria-hidden="true">
            <Plus size={25} />
          </span>
          <h3>كل الجامعات</h3>
          <p>استكشف الدليل والكليات والمقررات المتاحة.</p>
        </Link>
      )}
    </div>
  );
}
