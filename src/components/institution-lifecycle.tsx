'use client';
import { useActionState, useState } from 'react';
import { changeInstitutionState } from '@/modules/institution/actions';
import type { FormState } from '@/modules/shared/form-state';
export function InstitutionLifecycle({
  id,
  name,
  active,
  toggleOnly = false,
  deleteOnly = false,
}: {
  id: string;
  name: string;
  active: boolean;
  toggleOnly?: boolean;
  deleteOnly?: boolean;
}) {
  const [state, action, pending] = useActionState(changeInstitutionState, {} as FormState);
  const [confirm, setConfirm] = useState(false);
  if (state.success?.includes('حذف')) return <span role="status">{state.success}</span>;
  return (
    <div className="institution-lifecycle">
      {!deleteOnly && (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="operation" value={active ? 'disable' : 'enable'} />
          <button type="submit" disabled={pending} className="text-link">
            {active ? 'تعطيل' : 'تنشيط'}
          </button>
        </form>
      )}
      {!toggleOnly && (
        <>
          <button
            type="button"
            className="institution-delete"
            onClick={() => setConfirm(!confirm)}
            aria-expanded={confirm}
          >
            حذف
          </button>
          {confirm && (
            <form action={action} className="institution-delete-confirm">
              <strong>تأكيد حذف {name}</strong>
              <p>
                ستختفي المؤسسة من القوائم ويتوقف جميع وكلائها. تبقى الطلبات والطلاب والسجلات
                المرتبطة محفوظة. لا يعيد تفعيل المؤسسة تفعيل الوكلاء تلقائيًا.
              </p>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="operation" value="delete" />
              <label>
                اكتب اسم المؤسسة لتأكيد الحذف
                <input name="confirmation" required autoComplete="off" />
              </label>
              <button type="submit" disabled={pending} className="button danger">
                تأكيد الحذف
              </button>
              <button type="button" className="button secondary" onClick={() => setConfirm(false)}>
                تراجع
              </button>
            </form>
          )}
        </>
      )}
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && (
        <p role="status" className={toggleOnly ? 'sr-only' : undefined}>
          {state.success}
        </p>
      )}
    </div>
  );
}
