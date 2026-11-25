'use client';
import { useActionState } from 'react';
import { generateStudentCode } from '@/modules/identity/student-code-actions';
export function StudentCodeForm({ requiredGender }: { requiredGender: boolean }) {
  const [state, action, pending] = useActionState(generateStudentCode, {});
  return (
    <form action={action} className="form-stack">
      <p>اختر النوع مرة واحدة لاستكمال بيانات الحساب.</p>
      <label>
        النوع
        <select
          name="gender"
          required={requiredGender}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) e.currentTarget.form?.requestSubmit();
          }}
        >
          <option value="">{requiredGender ? 'اختر النوع' : 'غير محدد (اختياري)'}</option>
          <option value="male">ولد</option>
          <option value="female">بنت</option>
        </select>
      </label>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
      {pending && <p role="status">جارٍ حفظ النوع</p>}
    </form>
  );
}
