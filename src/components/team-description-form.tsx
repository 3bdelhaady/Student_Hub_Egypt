'use client';
import { useActionState } from 'react';
import { saveTeamDescription } from '@/modules/portal/team-description';
export function TeamDescriptionForm({ id, description }: { id: string; description: string }) {
  const [state, action, pending] = useActionState(saveTeamDescription, {});
  return (
    <form action={action} className="form-stack team-description-form">
      <input type="hidden" name="id" value={id} />
      <label>
        وصف الفريق
        <textarea
          aria-label="وصف الفريق"
          name="description"
          defaultValue={description}
          rows={4}
          maxLength={12000}
        />
      </label>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
      <button className="button" disabled={pending}>
        حفظ الوصف
      </button>
    </form>
  );
}
