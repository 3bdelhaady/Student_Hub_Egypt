'use client';
import { useActionState } from 'react';
import { deleteAgentResource } from '@/modules/agent-academic/actions';
export function DeleteAgentResource({ id, courseId }: { id: string; courseId: string }) {
  const [state, action, pending] = useActionState(deleteAgentResource, {});
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="courseId" value={courseId} />
      <label className="checkbox">
        <input name="deleteConsent" type="checkbox" required />
        أؤكد حذف هذا المورد وإجاباته وتقدم الطلاب المرتبط به نهائيًا
      </label>
      <button className="button secondary" disabled={pending}>
        حذف المورد
      </button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
    </form>
  );
}
