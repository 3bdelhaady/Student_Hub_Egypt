'use client';
import { useActionState } from 'react';
import { saveNationalId } from '@/modules/identity/national-id-actions';
export function NationalIdForm() {
  const [state, action, pending] = useActionState(saveNationalId, {});
  return (
    <form action={action} className="portal-form-section">
      <h2>
        <>الرقم القومي</>
      </h2>
      <p>
        <>أدخل رقمك القومي لعرضه لك ولأدمن المنصة فقط.</>
      </p>
      <label>
        <>الرقم القومي</>
        <input
          name="nationalId"
          inputMode="numeric"
          pattern="[0-9٠-٩۰-۹]{14}"
          minLength={14}
          maxLength={14}
          autoComplete="off"
          required
        />
      </label>
      {state.error && (
        <p role="alert">
          <>{state.error}</>
        </p>
      )}
      {state.success && (
        <p role="status">
          <>{state.success}</>
        </p>
      )}
      <button className="button primary" disabled={pending}>
        <>حفظ الرقم القومي</>
      </button>
    </form>
  );
}
