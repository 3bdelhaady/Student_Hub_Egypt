'use client';
import { type FormState } from '@/modules/shared/form-state';
import { useActionState } from 'react';
import { Bookmark, CheckCircle2, SendHorizonal } from 'lucide-react';
import {
  toggleSavedCourse,
  toggleResourceProgress,
  submitAssignment,
} from '@/modules/learning/actions';
const initial: FormState = {};
export function SaveCourseButton({ courseId, saved }: { courseId: string; saved: boolean }) {
  const [state, action, pending] = useActionState(toggleSavedCourse, initial);
  return (
    <form action={action} className="learning-action">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="saved" value={String(saved)} />
      <button className="button secondary" type="submit" disabled={pending} aria-pressed={saved}>
        <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
        {pending ? 'جارٍ الحفظ…' : saved ? 'إزالة من المحفوظات' : 'حفظ المقرر'}
      </button>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-hint">
          {state.success}
        </p>
      )}
    </form>
  );
}
export function CompleteResourceButton({
  resourceId,
  completed,
}: {
  resourceId: string;
  completed: boolean;
}) {
  const [state, action, pending] = useActionState(toggleResourceProgress, initial);
  return (
    <form action={action} className="learning-action resource-completion">
      <input type="hidden" name="resourceId" value={resourceId} />
      <input type="hidden" name="completed" value={String(completed)} />
      <button
        className={`button ${completed ? 'secondary' : 'primary'}`}
        type="submit"
        disabled={pending}
        aria-pressed={completed}
      >
        <CheckCircle2 size={17} />
        {pending ? 'جارٍ الحفظ…' : completed ? 'مكتمل، التراجع عن الإكمال' : 'تحديد كمكتمل'}
      </button>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-hint">
          {state.success}
        </p>
      )}
    </form>
  );
}
export function AssignmentForm({
  resourceId,
  initialBody,
  initialUrl,
  updatedAt,
}: {
  resourceId: string;
  initialBody: string;
  initialUrl: string;
  updatedAt: Date | null;
}) {
  const [state, action, pending] = useActionState(submitAssignment, initial);
  return (
    <form action={action} className="learning-action assignment-form">
      <input type="hidden" name="resourceId" value={resourceId} />
      <label>
        إجابتك
        <textarea
          name="body"
          defaultValue={initialBody}
          required
          minLength={10}
          maxLength={20000}
          rows={4}
        />
      </label>
      <label>
        رابط مستندك (https، اختياري)
        <input
          name="url"
          type="url"
          dir="ltr"
          inputMode="url"
          placeholder="https://…"
          defaultValue={initialUrl}
          maxLength={2200}
        />
      </label>
      <button className="button primary" type="submit" disabled={pending}>
        <SendHorizonal size={17} />
        {pending ? 'جارٍ التسليم…' : initialBody ? 'تحديث الإجابة' : 'تسليم الواجب'}
      </button>
      {updatedAt && (
        <p className="form-hint">
          آخر تحديث لإجابتك:{' '}
          {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(
            new Date(updatedAt),
          )}
        </p>
      )}
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-hint">
          {state.success}
        </p>
      )}
    </form>
  );
}
