'use client';
import { useState } from 'react';
import type { UniversityOption, FacultyOption } from './academic-selects';
import type { SignupKind } from '@/modules/identity/signup-policy';
export type SignupInstitution = {
  id: string;
  name: string;
  universityId: string | null;
  kind: string;
};
export function SignupScopeSelects({
  kind,
  universities,
  faculties,
  institutions,
}: {
  kind: SignupKind;
  universities: UniversityOption[];
  faculties: FacultyOption[];
  institutions: SignupInstitution[];
}) {
  const [universityId, setUniversityId] = useState('');
  const privateSector = kind === 'private_sector';
  const available = privateSector
    ? institutions.filter((i) => i.kind === 'private_sector')
    : faculties.filter((f) => f.universityId === universityId);
  return (
    <>
      {!privateSector && (
        <label>
          الجامعة
          <select
            name="universityId"
            aria-label="الجامعة"
            value={universityId}
            required
            onChange={(e) => setUniversityId(e.target.value)}
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
      )}
      <label>
        {privateSector ? 'المؤسسة' : 'الكلية'}
        <select
          name={privateSector ? 'institutionId' : 'facultyId'}
          aria-label={privateSector ? 'المؤسسة' : 'الكلية'}
          key={`${kind}-${universityId}`}
          defaultValue=""
          disabled={(!privateSector && !universityId) || !available.length}
          required
        >
          <option value="" disabled>
            {privateSector || universityId
              ? privateSector
                ? 'اختر المؤسسة المتاحة'
                : 'اختر كليتك'
              : 'اختر الجامعة أولًا'}
          </option>
          {available.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </label>
      <p className="form-hint">
        {(privateSector || universityId) && !available.length
          ? 'لا توجد خيارات متاحة لهذا النطاق، تواصل مع الدعم، ولا تختَر نطاقًا مختلفًا.'
          : kind === 'student'
            ? 'يراجع وكيل شؤون الطلاب في كليتك طلب تفعيل حسابك.'
            : 'يراجع أدمن المنصة طلب التفعيل ويحدد الصلاحيات، التسجيل لا يمنح وصولًا إلى بيانات المؤسسة.'}
      </p>
    </>
  );
}
