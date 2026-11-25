'use client';
import { useActionState } from 'react';
import { assignFacultyOfficer } from '@/modules/institution/officer-assignment';
export function OfficerAssignmentForm({
  organizations,
}: {
  organizations: { id: string; name: string; kind: string }[];
}) {
  const [state, action, pending] = useActionState(assignFacultyOfficer, {});
  return (
    <form action={action} className="form-stack">
      <label>
        البريد الإلكتروني للطالب
        <input type="email" name="email" required maxLength={254} />
      </label>
      <label>
        الاتحاد أو النشاط الطلابي
        <select name="organizationId" required>
          <option value="">اختر الجهة</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.kind === 'student_union' ? 'اتحاد طلاب' : 'نشاط طلابي'} · {o.name}
            </option>
          ))}
        </select>
      </label>
      <p className="form-hint">
        أضف حساب طالب مسجلًا بالفعل من كليتك وغير معيّن مسبقًا، لا تتغير كلمة المرور أو عضوية الطالب أو
        تعيين سابق، التفعيل نهائي من شؤون الطلاب، دون موافقة الأدمن، تظهر بطاقة لإدارة صلاحياته، ولا
        تُمنح صلاحيات الأقسام تلقائيًا.
      </p>
      <button className="button primary" disabled={pending}>
        تفعيل صلاحية Coordinator
      </button>
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
    </form>
  );
}
