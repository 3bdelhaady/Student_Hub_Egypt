'use client';
import { useActionState } from 'react';
import { applyToVolunteerOrganization } from '@/modules/volunteering/organization-actions';
export function OrganizationVolunteerForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(applyToVolunteerOrganization, {});
  return (
    <form action={action} className="organization-volunteer-form">
      <input type="hidden" name="organizationId" value={organizationId} />
      <label>
        <>ملاحظات للجهة، اختياري</>
        <textarea name="notes" maxLength={3000} rows={3} />
      </label>
      <label className="checkbox">
        <input type="checkbox" name="applicationConsent" required />
        <>أوافق على إرسال طلبي وملاحظاتي إلى الجهة المختارة.</>
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
        <>تقديم طلب تطوع</>
      </button>
    </form>
  );
}
