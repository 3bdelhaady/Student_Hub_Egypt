'use client';
import { useActionState, useState } from 'react';
import { Send, Users } from 'lucide-react';
import { applyForVolunteering } from '@/modules/volunteering/actions';
export type VolunteerDivision = { id: string; label: string; description: string };
export function VolunteerApplicationForm({
  entryId,
  divisions,
}: {
  entryId: string;
  divisions: VolunteerDivision[];
}) {
  const [state, action, pending] = useActionState(applyForVolunteering, {});
  const [divisionId, setDivisionId] = useState(''),
    [notes, setNotes] = useState(''),
    [consent, setConsent] = useState(false);
  return (
    <form action={action} className="volunteer-application-form">
      <input type="hidden" name="entryId" value={entryId} />
      <fieldset className="volunteer-division-options">
        <legend className="volunteer-visually-hidden">اختر قسم التطوع</legend>
        {divisions.map((division) => (
          <label key={division.id} className={divisionId === division.id ? 'selected' : ''}>
            <input
              type="radio"
              name="divisionId"
              value={division.id}
              required
              checked={divisionId === division.id}
              onChange={() => setDivisionId(division.id)}
            />
            <span>
              <strong>{division.label}</strong>
              {division.description && <small>{division.description}</small>}
            </span>
            <Users size={21} />
          </label>
        ))}
      </fieldset>
      <label className="volunteer-notes">
        ملاحظات للجهة، اختياري
        <textarea
          name="notes"
          rows={3}
          maxLength={3000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ما الذي ترغب أن يعرفه المسؤول عن طلبك؟ لا ترسل كلمة مرور أو بيانات دفع."
        />
      </label>
      <p className="volunteer-application-preview">
        سيُسجل طلب تطوع في القسم الذي اخترته، مع ملاحظاتك إن أضفتها.
      </p>
      <label className="checkbox volunteer-consent">
        <input
          type="checkbox"
          name="applicationConsent"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        أوافق على إرسال اختياري وملاحظاتي إلى الجهة المختارة.
      </label>
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
      <button type="submit" className="button primary" disabled={pending}>
        <Send size={18} />
        {pending ? 'جارٍ إرسال الطلب' : 'تقديم الطلب'}
      </button>
    </form>
  );
}
