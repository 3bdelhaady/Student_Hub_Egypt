'use client';
import { useActionState } from 'react';
import { reviewCertificateChange } from '@/modules/portal/certificate-review-actions';
export function CertificateReviewForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reviewCertificateChange, {});
  return (
    <form action={action} className="form-stack">
      <input name="id" type="hidden" value={id} />
      <label className="checkbox">
        <input name="confirm" type="checkbox" required />
        راجعت بيانات الشهادة وأؤكد قراري
      </label>
      <div>
        <button className="button primary" name="decision" value="approve" disabled={pending}>
          موافقة وتوثيق الشهادة
        </button>
        <button className="button secondary" name="decision" value="reject" disabled={pending}>
          رفض التعديل
        </button>
      </div>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {state.success}
        </p>
      )}
    </form>
  );
}
