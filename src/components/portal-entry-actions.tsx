'use client';
import { useActionState } from 'react';
import { archivePortalEntry } from '@/modules/portal/entry-actions';
export function ArchivePortalEntry({ id }: { id: string }) {
  const [state, action, pending] = useActionState(archivePortalEntry, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <label className="checkbox">
        <input type="checkbox" name="confirm" required />
        أؤكد حذف العنصر من العرض مع الاحتفاظ بالطلبات السابقة
      </label>
      <button className="button secondary" disabled={pending}>
        حذف العنصر
      </button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
    </form>
  );
}
