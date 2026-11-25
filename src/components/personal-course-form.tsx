'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, ArrowUp, ArrowDown, BookOpen } from 'lucide-react';
import { createPersonalCourse } from '@/modules/personal-learning/actions';
export function PersonalCourseForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState([{ key: 0, title: '', url: '' }]);
  const [state, action, pending] = useActionState(createPersonalCourse, {});
  const items = rows
    .filter((row) => row.title.trim() || row.url.trim())
    .map(({ title, url }) => ({ title, url, body: '' }));
  function move(index: number, delta: number) {
    setRows((current) => {
      const next = [...current];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }
  return (
    <form action={action} className="personal-course-create">
      <div className="personal-course-title">
        <div>
          <h1>إنشاء دورة تعليمية خاصة</h1>
          <p>اجمع مصادر تعلمك في مسار خاص بك، لا تظهر هذه الدورة للطلاب الآخرين.</p>
        </div>
        <span className="personal-resource-count">
          <strong>{items.length}</strong> موارد مضافة
        </span>
      </div>
      <div className="personal-learning-panel form-stack">
        <h2>
          <BookOpen size={23} /> تفاصيل الدورة
        </h2>
        <label>
          اسم الدورة
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={2}
            maxLength={160}
            placeholder="مثال: أساسيات هندسة البيانات"
          />
        </label>
        <label>
          الوصف
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={4000}
            rows={3}
            placeholder="ما الذي تريد تعلمه؟"
          />
        </label>
      </div>
      <div className="section-heading">
        <h2>إضافة الموارد</h2>
        <button
          className="button secondary"
          type="button"
          disabled={rows.length >= 100 || pending}
          onClick={() =>
            setRows([
              ...rows,
              { key: Math.max(-1, ...rows.map((r) => r.key)) + 1, title: '', url: '' },
            ])
          }
        >
          <Plus size={17} /> أضف موردًا
        </button>
      </div>
      <input type="hidden" name="resources" value={JSON.stringify(items)} />
      <div className="personal-resource-rows">
        {rows.map((row, index) => (
          <div className="personal-resource-row" key={row.key}>
            <label>
              اسم المورد {index + 1}
              <input
                value={row.title}
                maxLength={160}
                onChange={(event) =>
                  setRows(
                    rows.map((r) => (r.key === row.key ? { ...r, title: event.target.value } : r)),
                  )
                }
              />
            </label>
            <label>
              رابط المورد {index + 1} (HTTPS)
              <input
                type="url"
                value={row.url}
                maxLength={2000}
                dir="ltr"
                placeholder="https://..."
                onChange={(event) =>
                  setRows(
                    rows.map((r) => (r.key === row.key ? { ...r, url: event.target.value } : r)),
                  )
                }
              />
            </label>
            <div className="personal-row-actions">
              <button
                type="button"
                className="button secondary"
                aria-label={`نقل المورد ${index + 1} لأعلى`}
                disabled={!index || pending}
                onClick={() => move(index, -1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                className="button secondary"
                aria-label={`نقل المورد ${index + 1} لأسفل`}
                disabled={index === rows.length - 1 || pending}
                onClick={() => move(index, 1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                className="button secondary"
                aria-label={`إزالة المورد ${index + 1}`}
                disabled={pending}
                onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="form-hint">
        الموارد روابط خارجية، وليست ملفات مرفوعة أو فيديوهات مستضافة على المنصة، يمكنك إضافة ملاحظات
        من داخل الدورة بعد حفظها.
      </p>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <div className="personal-create-actions">
        <button className="button primary" name="status" value="active" disabled={pending}>
          {pending ? 'جارٍ الحفظ…' : 'إنشاء الدورة'}
        </button>
        <button className="button secondary" name="status" value="draft" disabled={pending}>
          حفظ كمسودة
        </button>
        <Link className="text-link" href="/services">
          إلغاء والعودة
        </Link>
      </div>
    </form>
  );
}
