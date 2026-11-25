import Link from 'next/link';
import { Plus, LockKeyhole } from 'lucide-react';
import { studentAreaViewer } from '@/lib/session';
import { personalCourseList } from '@/modules/personal-learning/queries';
import { personalProgress } from '@/modules/personal-learning/policy';
import { studentLoginPath } from '@/modules/shared/return-path';
export async function LearningCenter() {
  const v = await studentAreaViewer();
  const mine = v ? await personalCourseList(v.user.id) : [];
  return (
    <section className="learning-center">
      <h1 className="sr-only">مركز التعلم</h1>
      <div className="section-heading">
        <div>
          <h2>دوراتك الخاصة</h2>
          <p className="form-hint">تنظيم شخصي لمصادر تعلمك، وليس مقررات معتمدة أو شهادات.</p>
        </div>
        <Link
          className="button primary"
          href={v ? '/learning/new' : studentLoginPath('/learning/new')}
        >
          <Plus size={17} /> أنشئ دورتك الخاصة
        </Link>
      </div>
      {mine.length ? (
        <div className="learning-center-personal">
          {mine.map((course) => (
            <article className="personal-learning-panel" key={course.id}>
              <span className="tag">
                <LockKeyhole size={13} /> {course.status === 'draft' ? 'مسودة' : 'خاصة بك'}
              </span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="personal-course-progress-label">
                <span>
                  {course.completed} من {course.total} موارد
                </span>
                <strong>{personalProgress(course.completed, course.total)}%</strong>
              </div>
              <progress
                aria-label={'تقدم ' + course.title}
                max={course.total || 1}
                value={course.completed}
              />
              <Link href={'/learning/' + course.id} className="button primary">
                {course.status === 'draft' ? 'استكمال المسودة' : 'مواصلة التعلم'}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="personal-learning-panel">
          <p>
            {v
              ? 'لم تنشئ دورات خاصة بعد، اجمع روابطك وملاحظاتك واحتفظ بتقدمك هنا.'
              : 'سجّل الدخول لإنشاء دوراتك الخاصة وحفظ روابطك وملاحظاتك وتقدمك.'}
          </p>
        </div>
      )}
    </section>
  );
}
