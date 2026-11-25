'use client';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { BookOpen, Code2, Pi, Search, Save, ArrowRight } from 'lucide-react';
import { saveCourseSelection } from '@/modules/learning/actions';
import type { FormState } from '@/modules/shared/form-state';

type Course = { id: string; title: string; category: string; code?: string; instructor: string };
export function CourseSelection({
  courses,
  initialIds,
  returnHref,
}: {
  courses: Course[];
  initialIds: string[];
  returnHref: string;
}) {
  const initialKey = JSON.stringify([...initialIds].sort());
  const [selected, setSelected] = useState(initialIds);
  const [query, setQuery] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);
  const [state, action, pending] = useActionState(saveCourseSelection, {} as FormState);
  useEffect(() => {
    setSelected(JSON.parse(initialKey));
  }, [initialKey]);
  const dirty = JSON.stringify([...selected].sort()) !== initialKey;
  const needle = query.trim().toLocaleLowerCase('ar-EG');
  const visible = courses.filter(
    (course) =>
      (!onlySelected || selected.includes(course.id)) &&
      (!needle ||
        `${course.title} ${course.code || ''} ${course.category} ${course.instructor}`
          .toLocaleLowerCase('ar-EG')
          .includes(needle)),
  );
  return (
    <section className="course-selection">
      <header className="course-selection-heading">
        <div>
          <h1>تعديل المقررات الدراسية</h1>
          <p>اختر المقررات لقائمتك الشخصية، إتاحة الموارد حسب عضويتك، وليست تسجيلًا جامعيًا رسميًا.</p>
        </div>
        <div className="course-selection-count">
          <strong>{selected.length}</strong>
          <span>مقررات في قائمتك</span>
        </div>
      </header>
      <form action={action}>
        <input type="hidden" name="courseIds" value={JSON.stringify(selected)} />
        <input type="hidden" name="previousIds" value={initialKey} />
        <div className="course-selection-toolbar">
          <label className="course-selection-search">
            <Search size={18} />
            <input
              aria-label="البحث في المقررات"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault();
              }}
              placeholder="ابحث باسم المقرر أو كوده أو اسم دكتور المقرر…"
              maxLength={120}
            />
          </label>
          <button className="button primary" type="submit" disabled={pending || !dirty}>
            <Save size={17} />
            {pending ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={pending || !dirty}
            onClick={() => setSelected(JSON.parse(initialKey))}
          >
            إلغاء التغييرات
          </button>
        </div>
        <div className="course-selection-filters">
          <button type="button" aria-pressed={!onlySelected} onClick={() => setOnlySelected(false)}>
            كل المقررات ({courses.length})
          </button>
          <button type="button" aria-pressed={onlySelected} onClick={() => setOnlySelected(true)}>
            المختارة ({selected.length})
          </button>
          {query && (
            <button type="button" onClick={() => setQuery('')}>
              مسح البحث
            </button>
          )}
        </div>
        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}
        {state.success && !dirty && (
          <p className="form-hint" role="status">
            {state.success}
          </p>
        )}
        {dirty && (
          <p className="form-hint course-selection-unsaved" role="status">
            التغييرات لم تُحفظ بعد.
          </p>
        )}
        <div className="course-selection-grid">
          {visible.map((course) => {
            const Icon = /برمج|حاسب|software|programming/i.test(course.title + course.category)
              ? Code2
              : /رياض|جبر|تفاضل|math/i.test(course.title + course.category)
                ? Pi
                : BookOpen;
            const checked = selected.includes(course.id);
            return (
              <article
                className={`course-selection-card${checked ? ' is-selected' : ''}`}
                key={course.id}
              >
                <label>
                  <span className="course-selection-card-top">
                    <Icon size={22} aria-hidden="true" />
                    <input
                      type="checkbox"
                      data-course-id={course.id}
                      aria-label={`اختيار ${course.title}`}
                      checked={checked}
                      disabled={pending}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [...selected, course.id]
                            : selected.filter((id) => id !== course.id),
                        )
                      }
                    />
                  </span>
                  <h2>{course.title}</h2>
                  <span className="course-selection-category">
                    {course.code || course.category}
                  </span>
                </label>
                <Link href={`/courses/${course.id}`}>فتح المقرر</Link>
              </article>
            );
          })}
        </div>
        {!visible.length && (
          <div className="empty">
            <BookOpen size={32} />
            <h2>{courses.length ? 'لا توجد مقررات مطابقة.' : 'لم تُنشر مقررات بعد.'}</h2>
            <p>
              {onlySelected
                ? 'جرّب كل المقررات أو امسح البحث.'
                : 'غيّر كلمات البحث أو عد لاحقًا إذا كانت القائمة فارغة.'}
            </p>
          </div>
        )}
      </form>
      <Link className="text-link course-selection-return" href={returnHref}>
        <ArrowRight size={17} />
        العودة إلى المقررات الدراسية
      </Link>
    </section>
  );
}
