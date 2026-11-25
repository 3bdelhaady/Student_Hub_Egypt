'use client';
import { useActionState, useEffect, useState } from 'react';
import { addPersonalResource, updatePersonalCourse } from '@/modules/personal-learning/actions';
import type { FormState } from '@/modules/shared/form-state';
function Status({ state }: { state: FormState }) {
  return (
    <>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-success" role="status">
          {state.success}
        </p>
      )}
    </>
  );
}
export function PersonalResourceForm({
  courseId,
  resource,
}: {
  courseId: string;
  resource?: { id: string; title: string; body: string; url: string };
}) {
  const [state, action, pending] = useActionState(addPersonalResource, {});
  const [title, setTitle] = useState(resource?.title || ''),
    [body, setBody] = useState(resource?.body || ''),
    [url, setUrl] = useState(resource?.url || '');
  useEffect(() => {
    if (state.success && !resource) {
      setTitle('');
      setBody('');
      setUrl('');
    }
  }, [state, resource]);
  return (
    <form
      action={action}
      className="form-stack"
      aria-label={resource ? 'تعديل ' + resource.title : 'إضافة مورد خاص'}
    >
      <input type="hidden" name="courseId" value={courseId} />
      {resource && <input type="hidden" name="resourceId" value={resource.id} />}
      <label>
        اسم المورد
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          minLength={2}
          maxLength={160}
        />
      </label>
      <label>
        ملاحظة شخصية
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          maxLength={12000}
        />
      </label>
      <label>
        رابط خارجي (اختياري)
        <input
          name="url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          dir="ltr"
          maxLength={2000}
          placeholder="https://..."
        />
      </label>
      <p className="form-hint">
        أضف ملاحظة أو رابط HTTPS، الروابط تفتح خارج المنصة؛ لا توجد استضافة فيديو أو ملفات هنا.
      </p>
      <Status state={state} />
      <button className="button primary" disabled={pending}>
        {pending ? 'جارٍ الحفظ…' : resource ? 'حفظ المورد' : 'إضافة المورد'}
      </button>
    </form>
  );
}
export function PersonalCourseEditForm({
  course,
}: {
  course: { id: string; title: string; description: string; status: string };
}) {
  const [state, action, pending] = useActionState(updatePersonalCourse, {});
  const [title, setTitle] = useState(course.title),
    [description, setDescription] = useState(course.description),
    [status, setStatus] = useState(course.status);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="courseId" value={course.id} />
      <label>
        اسم الدورة
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          minLength={2}
          maxLength={160}
        />
      </label>
      <label>
        الوصف
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
        />
      </label>
      <label>
        الحالة
        <select name="status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="active">قيد التعلم</option>
          <option value="draft">مسودة</option>
        </select>
      </label>
      <Status state={state} />
      <button className="button primary" disabled={pending}>
        {pending ? 'جارٍ الحفظ…' : 'حفظ تفاصيل الدورة'}
      </button>
    </form>
  );
}
