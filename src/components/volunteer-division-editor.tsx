'use client';
import { useState } from 'react';
type Division = { id: string; label: string; description: string; active: boolean };
export function VolunteerDivisionEditor({ initial }: { initial: Division[] }) {
  const [rows, setRows] = useState(initial);
  const change = (index: number, patch: Partial<Division>) =>
    setRows((items) => items.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  return (
    <fieldset className="volunteer-division-editor">
      <legend>أقسام التطوع الفعلية المتاحة لهذه الفرصة</legend>
      <input type="hidden" name="volunteerDivisions" value={JSON.stringify(rows)} />
      <p className="form-hint">
        هذه أقسام استقبال المتطوعين، وليست صلاحيات إدارة المؤسسة، لا تضف أقسامًا أو مسؤوليات غير
        متاحة فعليًا، إخفاء القسم أو حذفه يمنع الطلبات الجديدة، وتبقى تسميته السابقة في الطلبات
        المسجلة.
      </p>
      {rows.map((row, index) => (
        <div className="portal-form-section" key={row.id || index}>
          <label>
            اسم القسم {index + 1}
            <input
              value={row.label}
              onChange={(e) => change(index, { label: e.target.value })}
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            وصف القسم، اختياري
            <textarea
              value={row.description}
              onChange={(e) => change(index, { description: e.target.value })}
              maxLength={500}
              rows={2}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={row.active}
              onChange={(e) => change(index, { active: e.target.checked })}
            />
            القسم متاح للطلبات الجديدة
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={() => setRows((items) => items.filter((_, i) => i !== index))}
          >
            حذف القسم {index + 1}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button secondary"
        disabled={rows.length >= 20}
        onClick={() =>
          setRows((items) => [...items, { id: '', label: '', description: '', active: true }])
        }
      >
        إضافة قسم تطوع
      </button>
      {!rows.length && (
        <p className="form-hint">
          لا توجد أقسام مهيأة، ستظهر الفرصة دون زر تقديم حتى تضيف قسمًا متاحًا.
        </p>
      )}
    </fieldset>
  );
}
