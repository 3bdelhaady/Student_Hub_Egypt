import Link from 'next/link';
import {
  ArrowUpLeft,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Newspaper,
  Lightbulb,
  HeartHandshake,
  Code2,
  Pi,
  MessagesSquare,
} from 'lucide-react';
export const icons = { course: BookOpen, news: Newspaper, opportunity: Lightbulb };
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-icon">
        <GraduationCap size={27} />
      </span>
      <span>
        Student Hub<small>مجتمعك، فرصتك، مستقبلك.</small>
      </span>
    </Link>
  );
}
export function Arrow() {
  return <ArrowUpLeft size={18} />;
}
export function SectionTitle({
  eyebrow,
  title,
  description,
  href,
  link,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {link || 'استكشف المزيد'}
          <ArrowLeft size={18} />
        </Link>
      )}
    </div>
  );
}
export function CourseCard({
  course,
  index = 0,
}: {
  course: {
    id: string;
    title: string;
    description: string;
    category: string;
    code?: string;
    instructor: string;
  };
  index?: number;
}) {
  const Icon = [Pi, Code2, MessagesSquare][index % 3];
  return (
    <Link href={`/courses/${course.id}`} className="course-card">
      <div className={`course-art art-${index % 3}`}>
        <span className="tiny-label">موارد تعليمية</span>
        <Icon size={66} strokeWidth={1.1} />
        <span className="art-word">{['LEARN', 'CREATE', 'CONNECT'][index % 3]}</span>
      </div>
      <div className="card-body">
        <span className="eyebrow">{course.code || course.category}</span>
        <h3>{course.title}</h3>
        <p>اسم دكتور المقرر: {course.instructor}</p>
        <p>{course.description}</p>
        <div className="card-bottom">
          <span>
            <BookOpen size={15} />
            محاضرات وموارد
          </span>
          <span className="round-arrow">
            <Arrow />
          </span>
        </div>
      </div>
    </Link>
  );
}
export function PostCard({
  post,
  index = 0,
}: {
  post: { id: string; title: string; excerpt: string; kind: string; category: string };
  index?: number;
}) {
  const Icon = post.kind === 'news' ? Newspaper : index % 2 ? Lightbulb : HeartHandshake;
  return (
    <Link href={`/community/${post.id}`} className="post-card">
      <div className={`post-icon tint-${index % 3}`}>
        <Icon size={29} />
      </div>
      <span className="eyebrow">{post.category}</span>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <span className="text-link">
        اقرأ التفاصيل
        <Arrow />
      </span>
    </Link>
  );
}
export function DemoNotice() {
  return null;
}
export function Empty({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <Sparkles size={38} />
      <h2>{title}</h2>
      <p>{body}</p>
      {href && (
        <Link className="button primary" href={href}>
          {label}
        </Link>
      )}
    </div>
  );
}
export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
