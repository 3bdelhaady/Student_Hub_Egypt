'use client';

import { RestaurantFields } from './restaurant-fields';
import { HousingFields } from './housing-fields';
import { VolunteerDivisionEditor } from './volunteer-division-editor';
import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import { reviewFacultyStudent } from '@/modules/portal/faculty-actions';
import type { FormState } from '@/modules/shared/form-state';
import {
  saveStudentProfile,
  savePortalEntry,
  submitPortalRequest,
  replyToRequest,
  decidePortalRequest,
  togglePortalSaved,
  voteInPoll,
} from '@/modules/portal/actions';
import { entryLabels, commerceKinds, requestStatuses } from '@/modules/portal/policy';
import {
  ScopeFields,
  type ScopeInstitution,
  type ScopeFaculty,
  type ScopeOrganization,
} from './institution-forms';
export function ActionForm({
  action,
  children,
  label = 'حفظ التغييرات',
  className = 'form-stack',
  nextHref,
  nextLabel,
  onSuccess,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children: React.ReactNode;
  label?: string;
  className?: string;
  nextHref?: string;
  nextLabel?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);
  return (
    <form action={formAction} className={className}>
      {children}

      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="form-success">
          {state.success}

          {nextHref && (
            <>
              <br />
              <Link className="text-link" href={nextHref}>
                {nextLabel || 'متابعة الطلب'}
              </Link>
            </>
          )}
        </p>
      )}

      <button className="button primary" disabled={pending} type="submit">
        {pending ? 'جارٍ الحفظ…' : label}
      </button>
    </form>
  );
}
export function StudentDetailsForm({
  name,
  email,
  phone = '',
  level = '',
  university = '',
  faculty = '',
}: {
  name: string;
  email: string;
  phone?: string;
  level?: string;
  university?: string;
  faculty?: string;
}) {
  return (
    <ActionForm action={saveStudentProfile} label="حفظ البيانات الشخصية">
      <div className="portal-form-section">
        <h2>البيانات الشخصية</h2>
        <div className="portal-form-grid">
          <label>
            الاسم بالكامل
            <input
              name="name"
              defaultValue={name}
              minLength={2}
              maxLength={100}
              required
              autoComplete="name"
            />
          </label>
          <label>
            البريد الإلكتروني
            <input value={email} readOnly dir="ltr" />
          </label>
          <label>
            رقم الهاتف
            <input name="phone" defaultValue={phone} maxLength={24} autoComplete="tel" dir="ltr" />
          </label>
          <label>
            كود الحساب
            <Link href="/profile">عرض كود الحساب في الملف الشخصي</Link>
          </label>
        </div>
      </div>
      <div className="portal-form-section">
        <h2>البيانات الأكاديمية</h2>
        <div className="portal-form-grid">
          <label>
            الجامعة
            <input value={university || 'لم تنضم لجامعة بعد'} readOnly />
          </label>
          <label>
            الكلية
            <input value={faculty || 'لم تحدد الكلية بعد'} readOnly />
          </label>

          <label>
            المستوى الدراسي
            <select name="level" defaultValue={level}>
              <option value="">اختر المستوى</option>

              {['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'دراسات عليا'].map(
                (x) => (
                  <option value={x} key={x}>
                    {x}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        <p className="form-hint">
          المستوى بيانات شخصية لا تمنح صلاحيات، تغيير الجامعة أو الكلية يحتاج مراجعة شؤون الطلاب.
        </p>
      </div>
    </ActionForm>
  );
}
export function RequestForm({
  entry,
  subject,
  contact = false,
  recipients = [],
}: {
  entry?: { id: string; kind: string; title: string; priceMinor: number; capacity: number | null };
  subject?: string;
  contact?: boolean;
  recipients?: { id: string; label: string }[];
}) {
  const [draftSubject, setDraftSubject] = useState(entry?.title || subject || '');
  const [draftBody, setDraftBody] = useState('');
  const [restoredDraft, setRestoredDraft] = useState(false);
  useEffect(() => {
    if (entry || subject) return;
    try {
      const raw = sessionStorage.getItem('student-hub-support-draft');
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft.subject === 'string' && typeof draft.body === 'string') {
        setDraftSubject(draft.subject.slice(0, 160));
        setDraftBody(draft.body.slice(0, 6000));
        setRestoredDraft(true);
      }
    } catch {
      /* Storage is optional; the form remains available. */
    }
  }, [entry, subject]);
  if (entry && commerceKinds.includes(entry.kind))
    return (
      <Link className="button primary" href={'/store/' + entry.id + '/checkout'}>
        دفع وإتمام عملية الشراء
      </Link>
    );
  return (
    <ActionForm
      action={submitPortalRequest}
      nextHref="/requests"
      nextLabel="عرض طلباتي ومتابعة الرد"
      label={entry ? 'إرسال الطلب للمراجعة' : contact ? 'إرسال الرسالة' : 'إرسال تذكرة الدعم'}
      onSuccess={
        entry || !restoredDraft
          ? undefined
          : () => {
              try {
                sessionStorage.removeItem('student-hub-support-draft');
              } catch {
                /* Optional local draft. */
              }
            }
      }
    >
      <input type="hidden" name="entryId" value={entry?.id || ''} />

      {!entry && (
        <label>
          الجهة المستقبلة
          <select name="recipient" defaultValue="admin">
            <option value="admin">أدمن المنصة، الدعم الفني</option>

            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <span className="form-hint">
            الرسالة خاصة بينك وبين الجهة المختارة. شؤون الطلاب واتحاد الطلاب يتبعان كليتك، والأنشطة
            الطلابية تتبع جامعتك. إذا لم يُعيّن مسؤول للجهة بعد، يُحفظ الطلب في انتظار تعيينه ولا يُحوّل
            إلى جهة أخرى.
          </span>
        </label>
      )}

      <label>
        {contact ? 'الموضوع' : 'عنوان الطلب'}
        <input
          name="subject"
          required
          minLength={3}
          maxLength={160}
          value={draftSubject}
          onChange={(event) => setDraftSubject(event.target.value)}
        />
      </label>
      <input type="hidden" name="quantity" value="1" />
      <label>
        {entry ? 'تفاصيل الطلب ووسيلة التواصل المناسبة' : contact ? 'الرسالة' : 'اشرح المشكلة'}

        <textarea
          name="body"
          value={draftBody}
          onChange={(event) => setDraftBody(event.target.value)}
          rows={5}
          required
          minLength={10}
          maxLength={6000}
          placeholder={
            entry
              ? 'اكتب التفاصيل التي يحتاجها المسؤول لمراجعة طلبك.'
              : 'ماذا حدث؟ وفي أي صفحة؟ لا ترسل كلمة مرور أو بيانات دفع.'
          }
        />
      </label>
    </ActionForm>
  );
}
export function RequestReply({ id }: { id: string }) {
  return (
    <ActionForm action={replyToRequest} label="إضافة رد">
      <input type="hidden" name="requestId" value={id} />
      <label>
        ردك
        <textarea name="body" rows={4} minLength={2} maxLength={6000} required />
      </label>
    </ActionForm>
  );
}
export function RequestDecision({
  id,
  status,
  manager = false,
}: {
  id: string;
  status: string;
  manager?: boolean;
}) {
  const choices: Record<string, string[]> = {
    pending: ['accepted', 'completed'],
    reviewing: ['accepted', 'completed'],
    accepted: ['completed'],
  };
  return manager ? (
    choices[status]?.length ? (
      <ActionForm action={decidePortalRequest} label="تحديث الحالة">
        <input type="hidden" name="requestId" value={id} />
        <label>
          الحالة الجديدة
          <select name="status">
            {choices[status].map((x) => (
              <option key={x} value={x}>
                {requestStatuses[x]}
              </option>
            ))}
          </select>
        </label>
      </ActionForm>
    ) : null
  ) : null;
}
export function SaveEntryButton({ id, saved }: { id: string; saved: boolean }) {
  return (
    <ActionForm
      action={togglePortalSaved}
      label={saved ? 'إزالة من المحفوظات' : 'حفظ في قائمتي'}
      className="compact-action"
    >
      <input type="hidden" name="entryId" value={id} />
      <input type="hidden" name="saved" value={String(saved)} />
    </ActionForm>
  );
}
export function VoteForm({
  id,
  options,
}: {
  id: string;
  options: { id: string; label: string }[];
}) {
  return (
    <ActionForm action={voteInPoll} label="تأكيد التصويت">
      <input type="hidden" name="entryId" value={id} />
      <fieldset className="poll-options">
        <legend>اختر إجابة واحدة</legend>

        {options.map((x) => (
          <label key={x.id}>
            <input type="radio" name="optionId" value={x.id} required />
            {x.label}
          </label>
        ))}
      </fieldset>
    </ActionForm>
  );
}
type EntryValue = {
  pollAudience?: string;
  id: string;
  kind: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  location: string;
  priceMinor: number;
  capacity: number | null;
  startsAt: string;
  closesAt: string;
  published: boolean;
  institutionId: string;
  facultyId: string | null;
  organizationId: string | null;
  department: string;
  housingDetails?: unknown;
  restaurantDetails?: unknown;
  volunteerDivisions?: { id: string; label: string; description: string; active: boolean }[];
  options?: string;
  teamCourseId?: string | null;
  teamMarker?: string;
  ticketType?: string;
  opportunityType?: string;
  provider?: string;
  requirements?: string;
};
export function PortalEntryForm({
  value,
  institutions,
  faculties,
  organizations,
  courses = [],
  allowedKinds = Object.keys(entryLabels),
  publishKinds = Object.keys(entryLabels),
  tripPublish = true,
  initialOpportunityType,
  ownScope,
}: {
  ownScope?: {
    institutionId: string;
    facultyId: string | null;
    organizationId: string | null;
    department: string;
  };
  allowedKinds?: string[];
  publishKinds?: string[];
  tripPublish?: boolean;
  initialOpportunityType?: string;
  value?: EntryValue;
  institutions: ScopeInstitution[];
  faculties: ScopeFaculty[];
  organizations: ScopeOrganization[];
  courses?: { id: string; title: string; universityId: string; published: boolean }[];
}) {
  const [kind, setKind] = useState(value?.kind || allowedKinds[0] || '');
  const [institutionId, setInstitutionId] = useState(
    value?.institutionId || (institutions.length === 1 ? institutions[0].id : ''),
  );
  const [teamCourseId, setTeamCourseId] = useState(value?.teamCourseId || '');
  const [ticketType, setTicketType] = useState(value?.ticketType || 'concert');
  const universityId = institutions.find((i) => i.id === institutionId)?.universityId;
  const fixedScope =
    ownScope ||
    (value
      ? {
          institutionId: value.institutionId,
          facultyId: value.facultyId,
          organizationId: value.organizationId,
          department: value.department,
        }
      : undefined);
  if (kind === 'poll' && fixedScope)
    return (
      <SimplePollForm
        value={value}
        ownScope={fixedScope}
        canPublish={publishKinds.includes('poll')}
      />
    );
  if (kind === 'service' && fixedScope)
    return (
      <SimpleOpportunityForm
        value={value}
        ownScope={fixedScope}
        initialType={initialOpportunityType}
        canPublish={publishKinds.includes('service')}
      />
    );
  return (
    <ActionForm action={savePortalEntry} label="حفظ ونشر حسب الاختيار">
      <input name="id" type="hidden" value={value?.id || ''} />

      {value ? (
        <>
          <input name="institutionId" type="hidden" value={value.institutionId} />
          <input name="facultyId" type="hidden" value={value.facultyId || ''} />
          <input name="organizationId" type="hidden" value={value.organizationId || ''} />
          <input name="department" type="hidden" value={value.department} />
        </>
      ) : ownScope ? (
        <>
          {Object.entries(ownScope).map(([key, val]) => (
            <input type="hidden" key={key} name={key} value={val || ''} />
          ))}

          <p>الإضافة محصورة في جهتك وكليتك.</p>
        </>
      ) : (
        <ScopeFields
          institutions={institutions}
          faculties={faculties}
          organizations={organizations}
          platform
          onInstitutionChange={(id) => {
            setInstitutionId(id);
            setTeamCourseId('');
          }}
        />
      )}

      <label>
        نوع الخدمة
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          disabled={!!value}
        >
          {Object.entries(entryLabels)
            .filter(([k]) => allowedKinds.includes(k))
            .map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
        </select>
      </label>

      {value && <input type="hidden" name="kind" value={value.kind} />}

      <div className="portal-form-grid">
        <label>
          العنوان
          <input name="title" defaultValue={value?.title} required minLength={2} maxLength={160} />
        </label>
        <label>
          التصنيف
          <input name="category" defaultValue={value?.category} maxLength={80} />
        </label>
      </div>
      <label>
        الوصف والتفاصيل
        <textarea
          name="description"
          defaultValue={value?.description}
          required
          minLength={10}
          maxLength={12000}
          rows={6}
        />
      </label>

      {kind === 'ticket' && (
        <label>
          نوع التذكرة
          <select
            name="ticketType"
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value)}
            required
          >
            <option value="concert">حفلة غنائية</option>
            <option value="graduation">حفلة تخرج</option>
            <option value="standup">حفلة ستاند أب كوميدي</option>
            <option value="trip">رحلة</option>
          </select>
        </label>
      )}

      {kind === 'service' && (
        <div className="portal-form-section">
          <h2>تفاصيل فرصة رابط الطلاب</h2>
          <label>
            نوع الفرصة
            <select
              name="opportunityType"
              defaultValue={value?.opportunityType || initialOpportunityType || ''}
            >
              <option value="">غير مصنفة، طلب سابق</option>
              <option value="job">وظيفة</option>
              <option value="internship">تدريب</option>
              <option value="scholarship">منحة</option>
            </select>
          </label>
          <label>
            الجهة المقدمة
            <input name="provider" maxLength={160} defaultValue={value?.provider || ''} />
          </label>
          <label>
            الشروط والمتطلبات
            <textarea
              name="requirements"
              rows={5}
              maxLength={6000}
              defaultValue={value?.requirements || ''}
            />
          </label>
          <p className="form-hint">
            التقديم طلب خاص يراجعه المسؤول داخل المنصة، وليس إرسالًا إلى شركة أو جهة خارجية، لا تضع
            فرصًا وهمية ضمن السجلات الحقيقية.
          </p>
        </div>
      )}

      {kind === 'team' && (
        <div className="portal-form-grid">
          <label>
            المقرر المرتبط بالفريق
            <select
              name="teamCourseId"
              value={teamCourseId}
              onChange={(e) => setTeamCourseId(e.target.value)}
              disabled={!universityId}
            >
              <option value="">اختر مقررًا مفعّلًا للفرق</option>

              {courses
                .filter((c) => c.universityId === universityId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                    {c.published ? '' : ' (غير منشور)'}
                  </option>
                ))}
            </select>
          </label>
          <label>
            الرمز البصري للفريق
            <p>{value?.teamMarker || 'يُعيّن تلقائيًا لكل مقرر: A ثم B ثم C'}</p>
          </label>
          <p className="form-hint">
            المقرر يجب أن يتبع جامعة المؤسسة، إلغاء نشره يخفي الفريق من تصفح الطلاب دون سحب صلاحية
            إدارته، الرمز البصري ليس رمز دعوة.
          </p>
        </div>
      )}

      <label>
        رابط الصورة، اختياري
        <input
          name="imageUrl"
          type="url"
          dir="ltr"
          defaultValue={value?.imageUrl}
          placeholder="https://"
          maxLength={1500}
        />
      </label>
      <label>
        الموقع أو جهة تقديم الخدمة
        <input name="location" defaultValue={value?.location} maxLength={200} />
      </label>
      <div className="portal-form-grid">
        <label>
          السعر بالجنيه المصري
          <input
            type="number"
            name="price"
            min={0}
            max={1000000}
            step="0.01"
            defaultValue={(value?.priceMinor || 0) / 100}
            required
          />
        </label>
        <label>
          السعة المتاحة، اتركها فارغة إن لم تنطبق
          <input
            type="number"
            name="capacity"
            min={0}
            max={100000}
            defaultValue={value?.capacity ?? ''}
          />
        </label>
        <label>
          تاريخ البداية، توقيت القاهرة
          <input type="datetime-local" name="startsAt" defaultValue={value?.startsAt} />
        </label>
        <label>
          آخر موعد للطلبات أو التصويت، توقيت القاهرة
          <input type="datetime-local" name="closesAt" defaultValue={value?.closesAt} />
        </label>
      </div>

      {kind === 'restaurant' && <RestaurantFields value={value?.restaurantDetails} />}

      {kind === 'housing' && <HousingFields value={value?.housingDetails} />}

      {kind === 'volunteer' && (
        <VolunteerDivisionEditor
          key={value?.volunteerDivisions?.map((d) => d.id).join(':') || 'new'}
          initial={value?.volunteerDivisions || []}
        />
      )}

      {kind === 'poll' && <PollOptionFields initial={value?.options} />}

      <label className="checkbox">
        <input
          name="published"
          type="checkbox"
          defaultChecked={value?.published}
          disabled={
            kind === 'ticket' && ticketType === 'trip' ? !tripPublish : !publishKinds.includes(kind)
          }
        />
        منشور للطلاب داخل النطاق
      </label>
      <p className="form-hint">
        انشر بيانات فعلية فقط، الطلبات يؤكدها المسؤول يدويًا، لا تدّعِ توفر دفع أو حجز أو شهادة رسمية
        لم تُصدر.
      </p>
    </ActionForm>
  );
}

export function FacultyStudentReview({ id, status }: { id: string; status: string }) {
  return (
    <ActionForm
      action={reviewFacultyStudent}
      label={status === 'active' ? 'إيقاف العضوية' : 'تفعيل العضوية'}
      className="form-stack"
    >
      <input type="hidden" name="membershipId" value={id} />
      <input type="hidden" name="status" value={status === 'active' ? 'suspended' : 'active'} />
      <label className="checkbox">
        <input name="confirmed" type="checkbox" required />
        أؤكد تغيير حالة هذا الطالب
      </label>
    </ActionForm>
  );
}

function SimplePollForm({
  value,
  ownScope,
  canPublish,
}: {
  value?: EntryValue;
  ownScope: {
    institutionId: string;
    facultyId: string | null;
    organizationId: string | null;
    department: string;
  };
  canPublish: boolean;
}) {
  const [state, action, pending] = useActionState(savePortalEntry, {});
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={value?.id || ''} />
      <input type="hidden" name="kind" value="poll" />
      <input type="hidden" name="minimalPoll" value="1" />
      {Object.entries(ownScope).map(([key, val]) => (
        <input type="hidden" key={key} name={key} value={val || ''} />
      ))}
      <label>
        العنوان
        <input name="title" required minLength={2} maxLength={160} defaultValue={value?.title} />
      </label>
      <PollOptionFields initial={value?.options} />
      <label>
        من يحق له التصويت
        <select name="pollAudience" defaultValue={value?.pollAudience || 'faculty'}>
          <option value="faculty">طلاب كليتي</option>
          <option value="university">طلاب الجامعة كلها</option>
        </select>
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
      <button className="button secondary" name="intent" value="draft" disabled={pending}>
        حفظ كمسودة
      </button>
      {canPublish && (
        <button className="button primary" name="intent" value="publish" disabled={pending}>
          حفظ ونشر التصويت
        </button>
      )}
    </form>
  );
}

function SimpleOpportunityForm({
  value,
  ownScope,
  initialType,
  canPublish,
}: {
  value?: EntryValue;
  ownScope: {
    institutionId: string;
    facultyId: string | null;
    organizationId: string | null;
    department: string;
  };
  initialType?: string;
  canPublish: boolean;
}) {
  const [state, action, pending] = useActionState(savePortalEntry, {});
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={value?.id || ''} />
      <input type="hidden" name="kind" value="service" />
      <input type="hidden" name="minimalOpportunity" value="1" />
      {Object.entries(ownScope).map(([key, val]) => (
        <input type="hidden" key={key} name={key} value={val || ''} />
      ))}
      <label>
        نوع الفرصة
        <select
          name="opportunityType"
          required
          defaultValue={value?.opportunityType || initialType || 'internship'}
        >
          <option value="internship">تدريب</option>
          <option value="scholarship">منحة</option>
          <option value="job">وظيفة</option>
        </select>
      </label>
      <label>
        العنوان
        <input name="title" required minLength={2} maxLength={160} defaultValue={value?.title} />
      </label>
      <label>
        الوصف
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={12000}
          rows={6}
          defaultValue={value?.description}
        />
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
      <button className="button secondary" name="intent" value="draft" disabled={pending}>
        حفظ كمسودة
      </button>
      {canPublish && (
        <button className="button primary" name="intent" value="publish" disabled={pending}>
          حفظ ونشر الفرصة
        </button>
      )}
    </form>
  );
}

function PollOptionFields({ initial }: { initial?: string }) {
  const [options, setOptions] = useState(() => initial?.split('\n').filter(Boolean) || ['']);
  return (
    <fieldset className="form-stack">
      <legend>خيارات التصويت</legend>
      <input type="hidden" name="options" value={options.join('\n')} />
      {options.map((option, index) => (
        <label key={index}>
          الخيار {index + 1}
          <input
            name="pollOption"
            required
            maxLength={160}
            value={option}
            onChange={(e) =>
              setOptions((values) => values.map((v, i) => (i === index ? e.target.value : v)))
            }
          />
        </label>
      ))}
      <button
        type="button"
        className="button secondary"
        aria-label="إضافة خيار"
        disabled={options.length >= 5}
        onClick={() => setOptions((values) => (values.length < 5 ? [...values, ''] : values))}
      >
        + إضافة خيار
      </button>
      <p className="form-hint">خياران على الأقل، بحد أقصى 5 خيارات.</p>
    </fieldset>
  );
}
