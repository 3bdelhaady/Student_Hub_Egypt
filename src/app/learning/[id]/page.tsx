import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, ExternalLink, ArrowRight, LockKeyhole, FileText } from 'lucide-react';
import { requireStudentViewer } from '@/lib/session';
import { personalCourseDetail } from '@/modules/personal-learning/queries';
import { personalProgress } from '@/modules/personal-learning/policy';
import { externalUrlHost } from '@/modules/shared/url';
import { changePersonalResource, deletePersonalCourse } from '@/modules/personal-learning/actions';
import { ActionForm } from '@/components/portal-forms';
import { PersonalResourceForm, PersonalCourseEditForm } from '@/components/personal-learning-forms';
export const metadata = { title: 'دورتي الخاصة' };
export default async function PersonalCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await requireStudentViewer('/learning/' + id);
  const detail = await personalCourseDetail(v.user.id, id);
  if (!detail) notFound();
  const { course, items } = detail;
  const completed = items.filter((item) => item.completedAt).length;
  return (
    <section className="personal-course-detail">
      <div className="breadcrumbs">
        <Link href="/services">
          <ArrowRight size={16} /> مركز التعلم
        </Link>
        <span>{course.title}</span>
      </div>
      <div className="personal-course-title">
        <div>
          <span className="tag">
            <LockKeyhole size={14} /> خاصة بك{course.status === 'draft' ? ' · مسودة' : ''}
          </span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
        <Link className="button secondary" href="#personal-course-settings">
          تعديل التفاصيل
        </Link>
      </div>
      <div className="personal-learning-progress">
        <BookOpen size={29} />
        <div>
          <strong>{personalProgress(completed, items.length)}% مكتمل</strong>
          <p>
            {completed} من {items.length} موارد، تقدم شخصي، وليس درجة أو شهادة.
          </p>
        </div>
        <progress aria-label="تقدم الدورة الخاصة" max={items.length || 1} value={completed} />
      </div>
      <div className="personal-course-columns">
        <section className="personal-learning-panel">
          <h2>قائمة الموارد</h2>
          {!items.length && <p>لم تضف موارد بعد، أضف رابطًا أو ملاحظة لتبدأ.</p>}
          {items.map((item, index) => (
            <article
              className="personal-learning-resource"
              key={item.id}
              data-resource-id={item.id}
            >
              <div className="section-heading">
                <h3>
                  <FileText size={18} /> {index + 1}. {item.title}
                </h3>
                <span className="tag">{item.completedAt ? 'مكتمل' : 'لم يكتمل'}</span>
              </div>
              {item.body && <p className="personal-resource-note">{item.body}</p>}
              {item.url && (
                <a
                  href={item.url}
                  className="button secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  فتح المورد الخارجي <ExternalLink size={15} />
                  <small dir="ltr">{externalUrlHost(item.url)}</small>
                </a>
              )}
              <details className="personal-resource-editor">
                <summary>تعديل المورد</summary>
                <PersonalResourceForm courseId={course.id} resource={item} />
              </details>
              <div className="personal-resource-controls">
                <ActionForm
                  action={changePersonalResource}
                  label={item.completedAt ? 'التراجع عن الإكمال' : 'تحديد كمكتمل'}
                >
                  <input type="hidden" name="courseId" value={course.id} />
                  <input type="hidden" name="resourceId" value={item.id} />
                  <input
                    type="hidden"
                    name="operation"
                    value={item.completedAt ? 'undo' : 'complete'}
                  />
                </ActionForm>
                <details className="personal-resource-delete">
                  <summary>حذف المورد</summary>
                  <ActionForm action={changePersonalResource} label="تأكيد حذف المورد">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="resourceId" value={item.id} />
                    <input type="hidden" name="operation" value="delete" />
                  </ActionForm>
                </details>
              </div>
            </article>
          ))}
        </section>
        <aside className="personal-learning-panel">
          <h2>أضف موردًا</h2>
          <PersonalResourceForm courseId={course.id} />
        </aside>
      </div>
      <details className="personal-learning-panel" id="personal-course-settings">
        <summary>تعديل تفاصيل الدورة</summary>
        <PersonalCourseEditForm course={course} />
      </details>
      <details className="personal-learning-panel personal-course-danger">
        <summary>حذف الدورة الخاصة</summary>
        <p>يحذف هذا دورتك ومواردها وتقدمك المحفوظ، لا يؤثر في المقررات الجامعية.</p>
        <ActionForm action={deletePersonalCourse} label="حذف الدورة نهائيًا">
          <input type="hidden" name="courseId" value={course.id} />
          <label className="check">
            <input type="checkbox" name="confirm" required /> أؤكد حذف هذه الدورة ومواردها
          </label>
        </ActionForm>
      </details>
    </section>
  );
}
