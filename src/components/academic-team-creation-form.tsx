'use client';
import { useActionState, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { proposeAcademicTeam } from '@/modules/academic-teams/actions';
export function AcademicTeamCreationForm({
  courses,
  initialCourseId,
}: {
  courses: {
    id: string;
    title: string;
    maxMembers: number;
    conditions: string;
    approvalRequired: boolean;
  }[];
  initialCourseId?: string;
}) {
  const [state, action, pending] = useActionState(proposeAcademicTeam, {});
  const [title, setTitle] = useState(''),
    [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(
    courses.some((c) => c.id === initialCourseId) ? initialCourseId! : '',
  );
  return (
    <form action={action} className="form-stack academic-team-creation-form">
      <label>
        اسم الفريق{' '}
        <input
          name="title"
          required
          minLength={2}
          maxLength={160}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="أدخل اسم الفريق"
        />
      </label>
      <label>
        الوصف{' '}
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={6000}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="اشرح فكرة الفريق والمشروع الذي تعملون عليه"
        />
      </label>
      <div className="academic-team-creation-fields">
        <div>
          <span>الرمز البصري للفريق</span>
          <p>يُعيّن تلقائيًا: A ثم B ثم C لكل مقرر</p>
        </div>
        <label>
          اسم المقرر{' '}
          <select
            name="courseId"
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="" disabled>
              اختر مقررًا فعّل المنسق الفرق فيه
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {courseId && (
        <div className="team-course-conditions">
          <p>أقصى عدد أعضاء: {courses.find((c) => c.id === courseId)?.maxMembers}</p>
          <p>{courses.find((c) => c.id === courseId)?.conditions || 'لا توجد شروط إضافية'}</p>
        </div>
      )}
      <p className="form-hint" id="team-marker-help">
        الرمز يُعيّن عند إرسال الطلب، ويبدأ من A لكل مقرر على حدة.
      </p>
      <p className="form-hint">
        {courses.find((c) => c.id === courseId)?.approvalRequired === false
          ? 'يُتاح الفريق مباشرة دون انتظار موافقة المنسق.'
          : 'يراجع منسق اتحاد الكلية الطلب قبل إتاحة الفريق.'}{' '}
        لا تُخصم رسوم من هذا النموذج.
      </p>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="button primary" disabled={pending}>
        <PlusCircle size={18} />
        {pending ? 'جارٍ إرسال الطلب' : 'إرسال طلب إنشاء فريق'}
      </button>
    </form>
  );
}
