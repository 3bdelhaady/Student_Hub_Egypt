'use client';
import { ActionForm } from './portal-forms';
import { saveTeamCourseSettings } from '@/modules/academic-teams/settings-actions';
import { useState } from 'react';
export function TeamCourseSettingsForm({
  courses,
}: {
  courses: {
    id: string;
    title: string;
    setting?: {
      enabled: boolean;
      approvalRequired?: boolean;
      maxMembers: number;
      conditions: string;
    };
  }[];
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const value = courses.find((c) => c.id === courseId)?.setting;
  return (
    <>
      <label>
        اختر المقرر
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <ActionForm key={courseId} action={saveTeamCourseSettings} label="حفظ شروط الفرق">
        <input type="hidden" name="courseId" value={courseId} />
        <label className="checkbox">
          <input type="checkbox" name="enabled" defaultChecked={value?.enabled} />
          تفعيل إنشاء الفرق لهذا المقرر
        </label>
        <label>
          أقصى عدد أعضاء للفريق
          <input
            type="number"
            name="maxMembers"
            required
            min={2}
            max={100}
            defaultValue={value?.maxMembers || 5}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            name="approvalRequired"
            defaultChecked={value?.approvalRequired ?? true}
          />
          إنشاء فريق جديد يحتاج موافقة المنسق
        </label>
        <label>
          الوصف
          <textarea name="conditions" maxLength={3000} defaultValue={value?.conditions || ''} />
        </label>
      </ActionForm>
    </>
  );
}
