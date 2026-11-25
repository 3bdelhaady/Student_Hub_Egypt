'use client';
import { useState } from 'react';
export type UniversityOption = { id: string; name: string };
export type FacultyOption = { id: string; name: string; universityId: string };
export function AcademicSelects({
  universities,
  faculties,
}: {
  universities: UniversityOption[];
  faculties: FacultyOption[];
}) {
  const [universityId, setUniversityId] = useState('');
  const available = faculties.filter((f) => f.universityId === universityId);
  return (
    <>
      <label>
        الجامعة
        <select
          aria-label="الجامعة"
          name="universityId"
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
          required
        >
          <option value="" disabled>
            اختر الجامعة المتاحة
          </option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        الكلية
        <select
          aria-label="الكلية"
          name="facultyId"
          key={universityId}
          defaultValue=""
          disabled={!available.length}
          required
          aria-describedby="faculty-hint"
        >
          <option value="" disabled>
            {universityId ? 'اختر كليتك' : 'اختر الجامعة أولًا'}
          </option>
          {available.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <p className="form-hint" id="faculty-hint">
        {universityId && !available.length
          ? 'لم يضف المسؤول كليات لهذه الجامعة بعد، لا تختَر جامعة مختلفة؛ راجع مسؤول المجتمع.'
          : 'القائمة خاصة بالجامعة المختارة، يُراجع المسؤول طلب الانضمام قبل التفعيل.'}
      </p>
    </>
  );
}
