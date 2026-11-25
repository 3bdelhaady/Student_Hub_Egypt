import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Rocket,
  Eye,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Search,
  Stethoscope,
  Wrench,
  Monitor,
  Landmark,
  Languages,
  HeartPulse,
  Pill,
  ShieldPlus,
} from 'lucide-react';
type Post = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  universityId: string;
  kind: string;
  category: string;
  createdAt: Date;
};
type University = { id: string; name: string; city: string };
export function PublicCommunity({
  posts,
  universities,
  faculties,
  params,
}: {
  posts: Post[];
  universities: University[];
  faculties: { id: string; name: string; universityId: string }[];
  params: { q?: string; kind?: string; category?: string; university?: string };
}) {
  const selected = universities.find((university) => university.id === params.university);
  const query = (params.q || '').slice(0, 120);
  const filtered = posts.filter(
    (post) =>
      (!params.university || post.universityId === params.university) &&
      (!params.kind || post.kind === params.kind) &&
      (!params.category || post.category === params.category) &&
      (!query || `${post.title} ${post.excerpt} ${post.body}`.includes(query)),
  );
  const availableFaculties = faculties.filter(
    (faculty) => !params.university || faculty.universityId === params.university,
  );
  const facultyIcon = (name: string) => {
    if (/الحاسبات|المعلومات|الذكاء/.test(name)) return Monitor;
    if (/الهندسة/.test(name)) return Wrench;
    if (/الصيدلة/.test(name)) return Pill;
    if (/التمريض/.test(name)) return ShieldPlus;
    if (/العلاج/.test(name)) return HeartPulse;
    if (/الطب/.test(name)) return Stethoscope;
    if (/الألسن|اللغات|الترجمة/.test(name)) return Languages;
    if (/إدارة|التجارة/.test(name)) return Landmark;
    return GraduationCap;
  };
  return (
    <div className="public-community">
      <section className="community-cover">
        <Image
          src="/design/community-hero.jpg"
          fill
          priority
          sizes="100vw"
          alt="تصميم توضيحي لمبنى جامعي، لا يمثل موقع جامعة بعينها"
        />
        <div className="container community-cover-copy">
          <span className="community-cover-label">نتعلم ونتشارك ونكبر معًا</span>
          <h1>{selected ? `مجتمع طلاب ${selected.name}` : 'مجتمعك الجامعي'}</h1>
          <p>
            مرحبًا بكم في مركز الطلاب، مساحة للمعرفة والتواصل واكتشاف الأخبار والفرص داخل المجتمع
            الجامعي.
          </p>
          <a href="#community-programs" className="button primary large">
            اكتشف كلياتنا <ArrowLeft size={18} aria-hidden="true" />
          </a>
          <span className="community-art-label">
            صورة توضيحية من تصميم المنصة، وليست توثيقًا لحرم جامعي
          </span>
        </div>
      </section>
      <section className="section container community-mission" aria-label="رسالة المجتمع ورؤيته">
        <article>
          <span className="community-mission-icon">
            <Rocket aria-hidden="true" />
          </span>
          <h2>الرسالة</h2>
          <p>
            نساند الطلاب بتنظيم الموارد الأكاديمية، وتقريب فرص التعلم والمشاركة، وتسهيل الوصول إلى
            مجتمعهم الجامعي.
          </p>
        </article>
        <article>
          <span className="community-mission-icon">
            <Eye aria-hidden="true" />
          </span>
          <h2>الرؤية</h2>
          <p>
            مساحة يتبادل فيها الطلاب المعرفة والخبرات، ويجد فيها كل طالب بداية أوضح لرحلته
            الأكاديمية.
          </p>
        </article>
      </section>
      <section className="section container community-programs" id="community-programs">
        <div className="reference-title">
          <span className="eyebrow">الكليات والمجتمعات</span>
          <h2>اكتشف كلياتنا</h2>
          <p>الكليات المتاحة حاليًا في دليل المنصة، وجود كلية هنا لا يعني اعتمادًا أو شراكة رسمية.</p>
        </div>
        <form className="community-university-filter">
          <label htmlFor="community-university">اختر الجامعة</label>
          <select
            name="university"
            id="community-university"
            defaultValue={params.university || ''}
          >
            <option value="">كل الجامعات</option>
            {universities.map((university) => (
              <option value={university.id} key={university.id}>
                {university.name}
              </option>
            ))}
          </select>
          <button className="button secondary">عرض الكليات والمحتوى</button>
        </form>
        <div className="community-faculty-grid">
          {availableFaculties.slice(0, 8).map((faculty, index) => {
            const Icon = facultyIcon(faculty.name);
            return (
              <Link
                href={`/community?university=${encodeURIComponent(faculty.universityId)}#community-news`}
                className={`community-faculty community-faculty-${index % 4}`}
                key={faculty.id}
              >
                <span>
                  <Icon size={25} aria-hidden="true" />
                </span>
                <h3>{faculty.name}</h3>
                <p>
                  {universities.find((university) => university.id === faculty.universityId)?.name}
                </p>
                <small>
                  نشرات المجتمع الجامعي <ArrowLeft size={14} aria-hidden="true" />
                </small>
              </Link>
            );
          })}
        </div>
        {!availableFaculties.length && (
          <p className="community-no-faculties">لا توجد كليات متاحة لهذه الجامعة في الدليل بعد.</p>
        )}
      </section>
      <section className="community-news-section" id="community-news">
        <div className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">جديد المجتمع الجامعي</span>
              <h2>أخبار وفرص المجتمع</h2>
              <p>المحتوى المنشور في المنصة، وليس تقويمًا رسميًا للفعاليات.</p>
            </div>
            <BookOpen size={34} aria-hidden="true" />
          </div>
          <form
            className="community-news-filters"
            role="search"
            aria-label="البحث في محتوى المجتمع"
          >
            <label>
              البحث
              <input
                name="q"
                defaultValue={query}
                maxLength={120}
                placeholder="ابحث في الأخبار والفرص..."
              />
            </label>
            {params.university && (
              <input type="hidden" name="university" value={params.university} />
            )}
            <label>
              نوع المحتوى
              <select name="kind" defaultValue={params.kind || ''}>
                <option value="">الكل</option>
                <option value="news">الأخبار والمقالات</option>
                <option value="opportunity">الفرص والمشاركة</option>
              </select>
            </label>
            <label>
              التصنيف
              <select name="category" defaultValue={params.category || ''}>
                <option value="">كل التصنيفات</option>
                {[...new Set(posts.map((post) => post.category))].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <button className="button primary">
              <Search size={16} aria-hidden="true" />
              بحث
            </button>
            <Link href="/community#community-news" className="text-link">
              مسح الفلاتر
            </Link>
          </form>
          <p className="directory-result-count">{filtered.length} نشرات مطابقة</p>
          <div className="community-news-grid">
            {filtered.map((post, index) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className={`community-news-card ${index === 0 ? 'is-featured' : ''}`}
              >
                <div className="community-news-art">
                  <Image
                    src={
                      index % 2 === 0
                        ? '/design/community-auditorium.jpg'
                        : '/design/community-robotics.jpg'
                    }
                    alt=""
                    fill
                    sizes="(max-width:760px) 100vw, 60vw"
                  />
                  <span>صورة توضيحية</span>
                </div>
                <div className="community-news-copy">
                  <div className="community-news-meta">
                    <span>{post.kind === 'opportunity' ? 'فرصة للمشاركة' : 'أخبار المجتمع'}</span>
                    <time dateTime={post.createdAt.toISOString()}>
                      <CalendarDays size={14} aria-hidden="true" />
                      نُشر {post.createdAt.toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}
                    </time>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <span className="community-read-more">
                    اقرأ التفاصيل <ArrowLeft size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {!filtered.length && (
            <div className="portal-empty">
              <h3>لا توجد نشرات مطابقة</h3>
              <p>جرّب كلمات أخرى أو اعرض جميع النشرات.</p>
              <Link href="/community#community-news" className="button secondary">
                عرض جميع النشرات
              </Link>
            </div>
          )}
        </div>
      </section>
      <section className="section container community-join-section">
        <div className="community-join">
          <h2>خليك قريب من مجتمعك</h2>
          <p>
            استكشف الأخبار والفرص والموارد من مساحتك الجامعية، لا نوفر اشتراكًا بالبريد الإلكتروني
            حاليًا.
          </p>
          <div>
            <Link href="/register" className="button white">
              إنشاء حساب
            </Link>
            <Link href="/login?next=%2Fcommunity" className="button community-join-login">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
