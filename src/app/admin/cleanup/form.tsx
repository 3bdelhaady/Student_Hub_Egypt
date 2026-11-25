'use client';
import { useActionState } from 'react';
import { requestedCleanup } from './actions';
export function CleanupForm({ digest }: { digest: string }) {
  const [state, action, pending] = useActionState(requestedCleanup, {});
  return (
    <form action={action}>
      <input type="hidden" name="digest" value={digest} />
      <label>
        اكتب حذف الحسابات غير المحددة
        <input name="confirm" required autoComplete="off" />
      </label>
      <p>
        تزال بيانات الدخول والجلسات والعضويات والصلاحيات للحسابات المستبعدة. تبقى مراجع تاريخية
        مجهولة لحماية الطلبات والسجلات. لا تتغير كلمات مرور الحسابات المحفوظة.
      </p>
      <button className="button danger" disabled={pending}>
        تنفيذ التنظيف المحدد
      </button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
    </form>
  );
}
