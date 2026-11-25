'use client';
import { useState } from 'react';
import { cairoInput } from '@/modules/shared/datetime';
import { postCategories, categoryOptions } from '@/modules/content/options';
import { useActionState } from 'react';
import { AcademicSelects, type FacultyOption, type UniversityOption } from './academic-selects';
import { saveFaculty } from '@/modules/catalog/actions';
import {
  importActivationCsv,
  joinUniversity,
  decideMembership,
} from '@/modules/membership/actions';
import { updateProfile } from '@/modules/identity/actions';
import { saveCourse, savePost, saveResource } from '@/modules/content/actions';
import { type FormState } from '@/modules/shared/form-state';
const initial: FormState = {};
function Status({ state }: { state: FormState }) {
  return (
    <>
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
    </>
  );
}
function Submit({ pending, label = 'حفظ التغييرات' }: { pending: boolean; label?: string }) {
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending ? 'جارٍ الحفظ…' : label}
    </button>
  );
}
export function JoinForm({
  universities,
  faculties,
}: {
  universities: UniversityOption[];
  faculties: FacultyOption[];
}) {
  const [state, action, pending] = useActionState(joinUniversity, initial);
  return (
    <form action={action} className="form-stack">
      <AcademicSelects universities={universities} faculties={faculties} />

      <Status state={state} />
      <Submit pending={pending} label="إرسال طلب الانضمام" />
    </form>
  );
}
export function FacultyForm({ value }: { value?: { id: string; name: string; active: boolean } }) {
  const [state, action, pending] = useActionState(saveFaculty, initial);
  return (
    <form action={action} className="form-stack">
      {value && <input type="hidden" name="id" value={value.id} />}
      <label>
        اسم الكلية
        <input name="name" minLength={2} maxLength={120} required defaultValue={value?.name} />
      </label>
      <label className="checkbox">
        <input type="checkbox" name="active" defaultChecked={value?.active ?? true} />
        متاحة لطلبات الانضمام الجديدة
      </label>
      <Status state={state} />
      <Submit pending={pending} />
    </form>
  );
}
export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return (
    <form action={action} className="form-stack">
      <label>
        اسم العرض
        <input name="name" defaultValue={name} required minLength={2} maxLength={100} />
      </label>
      <Status state={state} />
      <Submit pending={pending} />
    </form>
  );
}
export function CourseForm({
  submitAction = saveCourse,
  canPublish = true,
  value,
}: {
  submitAction?: typeof saveCourse;
  canPublish?: boolean;
  categories?: string[];
  value?: {
    id: string;
    title: string;
    description: string;
    category: string;
    instructor: string;
    code?: string;
    published: boolean;
  };
}) {
  const [state, action, pending] = useActionState(submitAction, initial);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={value?.id || ''} />
      <div className="two-col">
        <label>
          اسم المقرر
          <input name="title" defaultValue={value?.title} required minLength={2} maxLength={160} />
        </label>
        <label>
          كود المقرر
          <input
            aria-label="كود المقرر"
            name="code"
            defaultValue={value?.code || ''}
            required
            maxLength={80}
          />
          <input type="hidden" name="category" value={value?.category || 'مقررات أكاديمية'} />
        </label>
      </div>
      <label>
        اسم دكتور المقرر
        <input
          name="instructor"
          defaultValue={value?.instructor}
          required
          minLength={2}
          maxLength={100}
        />
      </label>
      <label>
        وصف المقرر
        <textarea
          name="description"
          defaultValue={value?.description}
          required
          minLength={10}
          maxLength={2000}
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="published"
          disabled={!canPublish}
          defaultChecked={value?.published}
        />
        نشر المقرر (يمكن إلغاء النشر بدل الحذف)
      </label>
      <Status state={state} />
      <Submit pending={pending} />
    </form>
  );
}
export function PostForm({
  value,
  categories = [],
}: {
  categories?: string[];
  value?: {
    id: string;
    title: string;
    excerpt: string;
    body: string;
    kind: 'news' | 'opportunity';
    category: string;
    published: boolean;
  };
}) {
  const [state, action, pending] = useActionState(savePost, initial);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={value?.id || ''} />
      <label>
        العنوان
        <input name="title" defaultValue={value?.title} required minLength={2} maxLength={160} />
      </label>
      <div className="two-col">
        <label>
          النوع
          <select name="kind" defaultValue={value?.kind || 'news'}>
            <option value="news">خبر</option>
            <option value="opportunity">فرصة تحريرية</option>
          </select>
        </label>
        <label>
          التصنيف
          <select
            aria-label="التصنيف"
            name="category"
            defaultValue={value?.category || ''}
            required
          >
            <option value="" disabled>
              اختر التصنيف
            </option>
            {categoryOptions(postCategories, [...categories, value?.category || '']).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        مقدمة قصيرة
        <textarea
          name="excerpt"
          defaultValue={value?.excerpt}
          required
          minLength={10}
          maxLength={400}
        />
      </label>
      <label>
        المحتوى
        <textarea
          name="body"
          defaultValue={value?.body}
          required
          minLength={20}
          maxLength={20000}
          rows={8}
        />
      </label>
      <label className="checkbox">
        <input name="published" type="checkbox" defaultChecked={value?.published} />
        نشر المحتوى للعامة
      </label>
      <Status state={state} />
      <Submit pending={pending} />
    </form>
  );
}
export function ResourceForm({
  submitAction = saveResource,
  courses,
  value,
}: {
  submitAction?: typeof saveResource;
  courses: { id: string; title: string }[];
  value?: {
    id: string;
    courseId: string;
    title: string;
    body: string;
    kind: 'lecture' | 'file' | 'section' | 'assignment' | 'video';
    url?: string | null;
    dueAt?: Date | null;
    position: number;
  };
}) {
  const [state, action, pending] = useActionState(submitAction, initial);
  const [kind, setKind] = useState<string>(value?.kind || 'lecture');
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={value?.id || ''} />
      <label>
        المقرر
        <select name="courseId" defaultValue={value?.courseId} required>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        عنوان المورد
        <input name="title" defaultValue={value?.title} required minLength={2} maxLength={180} />
      </label>
      <div className="two-col">
        <label>
          النوع
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="lecture">محاضرة</option>
            <option value="file">مذكرة أو ملف</option>
            <option value="section">قسم تنظيمي</option>
            <option value="assignment">واجب</option>
            <option value="video">فيديو</option>
          </select>
        </label>
        <label>
          الترتيب
          <input
            name="position"
            type="number"
            min={0}
            max={1000}
            defaultValue={value?.position || 0}
          />
        </label>
      </div>
      {kind !== 'section' && (
        <label>
          رابط خارجي (https){kind === 'video' ? '، مطلوب للفيديو' : '، اختياري'}
          <input
            name="url"
            type="url"
            dir="ltr"
            inputMode="url"
            placeholder="https://…"
            defaultValue={value?.url || ''}
            maxLength={2200}
            required={kind === 'video'}
          />
        </label>
      )}
      {kind === 'assignment' && (
        <label>
          موعد التسليم بتوقيت القاهرة (اختياري)
          <input
            name="dueAt"
            type="datetime-local"
            dir="ltr"
            defaultValue={cairoInput(value?.dueAt ? new Date(value.dueAt) : null)}
          />
        </label>
      )}
      <label>
        {kind === 'section' ? 'وصف مختصر للقسم (اختياري)' : 'المحتوى النصي'}
        <textarea
          name="body"
          defaultValue={value?.body}
          required={kind !== 'section'}
          minLength={kind === 'section' ? 0 : 10}
          maxLength={kind === 'section' ? 2000 : 30000}
          rows={8}
        />
      </label>
      <p className="form-hint">
        {kind === 'section'
          ? 'القسم عنوان ينظّم الموارد التي تليه حسب الترتيب.'
          : kind === 'assignment'
            ? 'اشرح المطلوب بوضوح، يجيب الطالب بنص ويمكنه إرفاق رابط https.'
            : 'الروابط الخارجية تُفتح في تبويب جديد وتبقى من مسؤولية ناشرها.'}
      </p>
      <Status state={state} />
      <Submit pending={pending} />
    </form>
  );
}
export function MemberDecision({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(decideMembership, initial);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={id} />
      <div className="inline-actions">
        <select
          name="status"
          defaultValue={status === 'pending' ? 'active' : status}
          aria-label="الحالة الجديدة"
        >
          <option value="active">مفعّل</option>
          <option value="rejected">مرفوض</option>
          <option value="suspended">موقوف</option>
        </select>
        <Submit pending={pending} label="تأكيد" />
      </div>
      <Status state={state} />
    </form>
  );
}
export function ActivationCsvForm() {
  const [state, action, pending] = useActionState(importActivationCsv, initial);
  return (
    <form action={action} className="form-stack">
      <div className="notice warning">
        محاكاة استيراد جامعي: يفعّل طلبات الطلاب المعلقة في مجتمعك فقط، لا يثبت ملكية البريد أو
        الهوية، ولا ينشئ حسابات جديدة أو يعيد تفعيل المرفوض والموقوف.
      </div>
      <label>
        ملف CSV — عمود email فقط
        <input name="csv" type="file" accept=".csv,text/csv" required />
      </label>
      <p className="form-hint">
        من ١ إلى ١٠٠ بريد، الحد الأقصى ٣٢ كيلوبايت، لا ترفع أرقامًا قومية أو بيانات إضافية، يطابق
        النظام البريد بدقة داخل مجتمعك فقط.
      </p>
      <Status state={state} />
      <Submit pending={pending} label="استيراد وتفعيل الطلبات المؤهلة" />
    </form>
  );
}
