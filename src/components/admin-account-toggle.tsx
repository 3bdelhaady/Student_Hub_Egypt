'use client';
import { useActionState } from 'react';
import { toggleAdminAccount } from '@/modules/institution/actions';
import type { FormState } from '@/modules/shared/form-state';
export function AdminAccountToggle({
  id,
  kind,
  active,
}: {
  id: string;
  kind: 'student' | 'agent';
  active: boolean;
}) {
  const [state, action, pending] = useActionState(toggleAdminAccount, {} as FormState);
  return (
    <form action={action} className="admin-account-toggle">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <button type="submit" disabled={pending} className="button secondary">
        {pending ? 'جارٍ التحديث…' : active ? 'تعطيل' : 'تفعيل'}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && (
        <span className="sr-only" role="status">
          {state.success}
        </span>
      )}
    </form>
  );
}
