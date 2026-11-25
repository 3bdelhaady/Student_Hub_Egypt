'use client';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';
type University = { id: string; name: string; city: string; fact: string };
export function UniversityCarousel({ universities }: { universities: University[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  function go(index: number) {
    const next = Math.max(0, Math.min(index, universities.length - 1));
    setActive(next);
    const element = track.current?.children[next] as HTMLElement | undefined;
    if (element && track.current)
      track.current.scrollTo({
        left: element.offsetLeft - (track.current.children[0] as HTMLElement).offsetLeft,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
  }
  if (!universities.length) return null;
  return (
    <div
      className="university-carousel"
      role="region"
      aria-roledescription="عرض شرائح"
      aria-label="الجامعات الموجودة على المنصة"
    >
      <div
        className="university-carousel-track"
        tabIndex={0}
        aria-label="اسحب يمينًا أو يسارًا بين الجامعات"
        ref={track}
        onScroll={() => {
          const el = track.current;
          if (el && el.scrollWidth > el.clientWidth + 2) {
            const first = el.children[0] as HTMLElement;
            const second = el.children[1] as HTMLElement | undefined;
            const step = second ? Math.abs(second.offsetLeft - first.offsetLeft) : el.clientWidth;
            setActive(
              Math.abs(el.scrollLeft) >= el.scrollWidth - el.clientWidth - 2
                ? universities.length - 1
                : Math.min(universities.length - 1, Math.round(Math.abs(el.scrollLeft) / step)),
            );
          }
        }}
      >
        {universities.map((u, index) => (
          <article
            className={`university-slide ${active === index ? 'is-current' : ''}`}
            key={u.id}
            role="group"
            aria-roledescription="شريحة"
            aria-label={`${index + 1} من ${universities.length}: ${u.name}`}
          >
            <span className="university-slide-icon" aria-hidden="true">
              <GraduationCap size={36} />
            </span>
            <span className="eyebrow">مجتمعنا في {u.city}</span>
            <h3>{u.name}</h3>
            <p>{u.fact}</p>
          </article>
        ))}
      </div>
      {universities.length > 1 && (
        <div className="university-carousel-controls">
          <button
            type="button"
            className="button secondary"
            aria-label="الجامعة السابقة"
            disabled={active === 0}
            onClick={() => go(active - 1)}
          >
            <ArrowRight size={20} aria-hidden="true" />
          </button>
          <div className="university-carousel-dots" aria-label="اختيار الجامعة">
            {universities.map((u, index) => (
              <button
                key={u.id}
                type="button"
                aria-label={`عرض ${u.name}`}
                aria-current={active === index ? 'true' : undefined}
                onClick={() => go(index)}
              >
                <span />
              </button>
            ))}
          </div>
          <span className="visually-hidden" aria-live="polite" aria-atomic="true">
            {active + 1} / {universities.length}
          </span>
          <button
            type="button"
            className="button secondary"
            aria-label="الجامعة التالية"
            disabled={active === universities.length - 1}
            onClick={() => go(active + 1)}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
