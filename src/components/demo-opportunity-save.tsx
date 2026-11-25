'use client';
import { useEffect, useState } from 'react';
export function DemoOpportunitySave({ id }: { id: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem('student-link-demo-saved') || '[]').includes(id));
    } catch {}
  }, [id]);
  return (
    <button
      className="student-link-save"
      aria-pressed={saved}
      onClick={() => {
        try {
          const ids: string[] = JSON.parse(localStorage.getItem('student-link-demo-saved') || '[]');
          localStorage.setItem(
            'student-link-demo-saved',
            JSON.stringify(saved ? ids.filter((x) => x !== id) : [...new Set([...ids, id])]),
          );
          setSaved(!saved);
        } catch {}
      }}
    >
      {saved ? 'إزالة من المحفوظات' : 'حفظ على هذا الجهاز'}
    </button>
  );
}
