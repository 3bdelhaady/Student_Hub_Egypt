'use client';
import type { InstitutionRestaurantInfo } from '@/modules/institution/restaurant-info';
import { governorates } from '@/modules/institution/governorates';
import { useActionState, useState, useEffect } from 'react';
import {
  saveInstitution,
  addInstitutionAgent,
  updateInstitutionAgent,
  saveStudentOrganization,
  saveDomainContent,
} from '@/modules/institution/actions';
import {
  departmentLabels,
  positionLabel,
  agentStatusLabels,
  institutionKinds,
} from '@/modules/institution/policy';
import type { FormState } from '@/modules/shared/form-state';
import {
  agentSections,
  permissionSections,
  sectionRights,
  type SectionPermissions,
} from '@/modules/institution/section-policy';
const initial: FormState = {};
function SectionPermissionFields({
  value,
  privateSector = false,
  activity = false,
}: {
  privateSector?: boolean;
  activity?: boolean;
  value: {
    canRead: boolean;
    canEdit: boolean;
    canPublish: boolean;
    sectionPermissions?: SectionPermissions | null;
  };
}) {
  return (
    <fieldset className="section-permissions">
      <legend>صلاحيات أقسام الخدمات ومساحة العمل الأكاديمية</legend>
      <input type="hidden" name="sectionPermissionsVersion" value="1" />
      <p className="form-hint">
        حدد القراءة والتعديل والنشر لكل قسم على حدة، التعديل يحتاج القراءة، والنشر يحتاج القراءة
        والتعديل في القسم نفسه.
      </p>
      {Object.entries(privateSector ? permissionSections : agentSections)
        .filter(([key]) => !activity || !['academic', 'team'].includes(key))
        .map(([key, label]) => {
          const rights = sectionRights(value, key);
          return (
            <fieldset className="section-permission-row" key={key}>
              <legend>{label}</legend>
              <div className="section-permission-options">
                {(['canRead', 'canEdit', 'canPublish'] as const).map((right, index) => (
                  <label className="checkbox" key={right}>
                    <input
                      type="checkbox"
                      name={`${key}.${right}`}
                      defaultChecked={rights[right]}
                      aria-label={`${label}: ${['قراءة', 'تعديل', 'نشر'][index]}`}
                    />
                    {['قراءة', 'تعديل', 'نشر'][index]}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      <p className="form-hint">
        الصلاحيات محصورة في الجهة والكلية والتعيين الحالي، ولا تفتح أقسام الطالب أو إدارة المنصة.
      </p>
    </fieldset>
  );
}
export type ScopeInstitution = {
  id: string;
  name: string;
  kind: string;
  universityId: string | null;
};
export type ScopeFaculty = { id: string; name: string; universityId: string };
export type ScopeOrganization = {
  id: string;
  name: string;
  institutionId: string;
  facultyId: string;
  kind: string;
};
function State({ state }: { state: FormState }) {
  return (
    <>
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
    </>
  );
}
function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending ? 'جارٍ الحفظ…' : label}
    </button>
  );
}
export type InstitutionValue = ScopeInstitution & {
  description: string;
  website: string;
  active: boolean;
  demo: boolean;
  governorate?: string;
  category?: string;
  restaurantInfo?: InstitutionRestaurantInfo | null;
};
export function InstitutionForm({
  value,
  universities = [],
  platform = false,
}: {
  value?: InstitutionValue;
  universities?: { id: string; name: string }[];
  platform?: boolean;
}) {
  const [state, action, pending] = useActionState(saveInstitution, initial);
  const [kind, setKind] = useState(value?.kind || 'university');
  const [category, setCategory] = useState(value?.category || 'general');
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={value?.id || ''} />
      <label>
        اسم المؤسسة
        <input name="name" defaultValue={value?.name} minLength={2} maxLength={160} required />
      </label>
      {value ? (
        <>
          <input type="hidden" name="kind" value={value.kind} />
          <input type="hidden" name="universityId" value={value.universityId || ''} />
          <p className="form-hint">
            {institutionKinds[value.kind]}، نوع المؤسسة ونطاق جامعتها ثابتان بعد الإنشاء.
          </p>
        </>
      ) : (
        <>
          <label>
            نوع المؤسسة
            <select
              aria-label="نوع المؤسسة"
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {Object.entries(institutionKinds).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          {kind === 'university' && (
            <label>
              الجامعة
              <select name="universityId" aria-label="الجامعة" required defaultValue="">
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
        </>
      )}
      {platform ? (
        <>
          {kind === 'private_sector' && (
            <label>
              تصنيف المؤسسة
              <select
                name="category"
                aria-label="تصنيف المؤسسة"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="general">خدمات ومتجر وموارد عامة</option>
                <option value="restaurant">مطعم أو كافيه</option>
              </select>
            </label>
          )}
          {kind === 'university' && <input type="hidden" name="category" value="general" />}
          <label>
            المحافظة
            <select
              aria-label="المحافظة"
              name="governorate"
              defaultValue={value?.governorate || ''}
              required={kind === 'university' || category === 'restaurant'}
            >
              <option value="">
                {kind === 'university' || category === 'restaurant'
                  ? 'اختر المحافظة'
                  : 'غير مرتبطة بمحافظة'}
              </option>
              {governorates.map((g) => (
                <option value={g} key={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <p className="form-hint">
            المطاعم تظهر فقط لطلاب الجامعات في محافظتها، تُحفظ محافظة الجامعة لاستخدامها في مطابقة
            الخدمات المحلية.
          </p>
        </>
      ) : (
        <>
          <input type="hidden" name="category" value={value?.category || 'general'} />
          <input type="hidden" name="governorate" value={value?.governorate || ''} />
        </>
      )}
      <label>
        نبذة عن المؤسسة
        <textarea name="description" defaultValue={value?.description} maxLength={2000} rows={5} />
      </label>
      <label>
        موقع المؤسسة، اختياري
        <input name="website" type="url" dir="ltr" defaultValue={value?.website} maxLength={1000} />
      </label>
      {platform && kind === 'private_sector' && category === 'restaurant' && (
        <fieldset>
          <legend>بيانات المطعم</legend>
          <p className="form-hint">
            للمطاعم والكافيهات، تظهر للوكيل للقراءة فقط. الصور JPG أو PNG أو WebP حتى ٦٠٠ كيلوبايت
            للصورة.
          </p>
          <input type="hidden" name="restaurantInfoPresent" value="1" />
          <div className="portal-form-grid">
            <label>
              موعد الفتح
              <input type="time" name="opensAt" defaultValue={value?.restaurantInfo?.opensAt} />
            </label>
            <label>
              موعد الإغلاق
              <input type="time" name="closesAt" defaultValue={value?.restaurantInfo?.closesAt} />
            </label>
            <label>
              هاتف التواصل
              <input name="phone" maxLength={30} defaultValue={value?.restaurantInfo?.phone} />
            </label>
            <label>
              التوصيل
              <select name="delivery" defaultValue={value?.restaurantInfo?.delivery || ''}>
                <option value="">لم يحدد</option>
                <option value="yes">متاح</option>
                <option value="no">غير متاح</option>
              </select>
            </label>
            <label>
              العنوان
              <input
                name="location"
                maxLength={300}
                defaultValue={value?.restaurantInfo?.location}
              />
            </label>
            <label>
              رابط موقع المطعم على الخريطة
              <input
                type="url"
                name="mapUrl"
                maxLength={1500}
                defaultValue={value?.restaurantInfo?.mapUrl}
              />
            </label>
            {(['logo', 'cover'] as const).map((key) => (
              <label key={key}>
                {key === 'logo' ? 'لوجو المطعم' : 'صورة كافر المطعم'}
                {value?.restaurantInfo?.[key] && (
                  <img
                    src={value.restaurantInfo[key]}
                    alt={key === 'logo' ? 'لوجو المطعم' : 'كافر المطعم'}
                    style={{ maxWidth: 240, maxHeight: 120, objectFit: 'contain' }}
                  />
                )}
                <span className="commerce-upload-control">
                  <span>رفع صورة</span>
                  <input
                    className="commerce-file-input"
                    type="file"
                    name={key}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file && file.size > 600 * 1024) {
                        e.currentTarget.value = '';
                        e.currentTarget.setCustomValidity('الحد الأقصى ٦٠٠ كيلوبايت للصورة');
                      } else e.currentTarget.setCustomValidity('');
                    }}
                  />
                </span>
                {value?.restaurantInfo?.[key] && (
                  <span>
                    <input type="checkbox" name={'remove' + key} />
                    حذف الصورة الحالية
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {platform && (
        <>
          <label className="checkbox">
            <input type="checkbox" name="active" defaultChecked={value?.active ?? true} />
            المؤسسة متاحة للوكلاء
          </label>
        </>
      )}
      <State state={state} />
      <Submit pending={pending} label="حفظ المؤسسة" />
    </form>
  );
}
function PermissionFields({
  value,
}: {
  value?: { canRead: boolean; canEdit: boolean; canPublish: boolean };
}) {
  return (
    <fieldset className="permission-fields">
      <legend>صلاحيات الوصول للقسم المحدد فقط</legend>
      <label className="checkbox">
        <input type="checkbox" name="canRead" defaultChecked={value?.canRead ?? true} />
        قراءة محتوى القسم
      </label>
      <label className="checkbox">
        <input type="checkbox" name="canEdit" defaultChecked={value?.canEdit ?? false} />
        إنشاء وتعديل المسودات
      </label>
      <label className="checkbox">
        <input type="checkbox" name="canPublish" defaultChecked={value?.canPublish ?? false} />
        نشر المحتوى وتعديل المنشور
      </label>
      <p className="form-hint">
        التعديل يحتاج القراءة، والنشر يحتاج القراءة والتعديل، لا تمنح هذه الخيارات إدارة المنصة أو
        نطاق قسم آخر.
      </p>
    </fieldset>
  );
}
export function ScopeFields({
  institutions,
  faculties,
  organizations,
  platform = false,
  organizationOnly = false,
  ownDepartment,
  onInstitutionChange,
  onDepartmentChange,
}: {
  institutions: ScopeInstitution[];
  faculties: ScopeFaculty[];
  organizations: ScopeOrganization[];
  platform?: boolean;
  organizationOnly?: boolean;
  ownDepartment?: string;
  onInstitutionChange?: (id: string) => void;
  onDepartmentChange?: (department: string) => void;
}) {
  const [institutionId, setInstitution] = useState(
    institutions.length === 1 ? institutions[0].id : '',
  );
  const inst = institutions.find((i) => i.id === institutionId);
  const [facultyId, setFaculty] = useState('');
  const [dept, setDept] = useState(
    organizationOnly ? 'student_union' : platform ? 'student_affairs' : 'student_union',
  );
  const departments =
    organizationOnly || !platform
      ? ownDepartment && ownDepartment !== 'student_affairs'
        ? [ownDepartment]
        : [
            ...new Set([
              ...(ownDepartment ? [ownDepartment] : []),
              'student_union',
              'student_activity',
            ]),
          ]
      : inst?.kind === 'private_sector'
        ? ['private_sector']
        : ['student_affairs', 'youth_welfare'];
  const current = departments.includes(dept) ? dept : departments[0];
  const officer = ['student_union', 'student_activity'].includes(current);
  useEffect(() => {
    onDepartmentChange?.(current);
  }, [current, onDepartmentChange]);
  return (
    <>
      <label>
        المؤسسة
        <select
          aria-label="المؤسسة"
          name="institutionId"
          value={institutionId}
          required
          onChange={(e) => {
            setInstitution(e.target.value);
            onInstitutionChange?.(e.target.value);
            setFaculty('');
          }}
        >
          <option value="" disabled>
            اختر المؤسسة
          </option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </label>
      {!organizationOnly && (
        <label>
          القسم
          <select
            aria-label="القسم"
            name="department"
            value={current}
            onChange={(e) => setDept(e.target.value)}
          >
            {departments.map((k) => (
              <option key={k} value={k}>
                {departmentLabels[k]}
              </option>
            ))}
          </select>
        </label>
      )}
      {(organizationOnly || current !== 'private_sector') && (
        <label>
          الكلية
          <select
            aria-label="الكلية"
            name="facultyId"
            required
            value={facultyId}
            onChange={(e) => setFaculty(e.target.value)}
            disabled={!inst?.universityId}
          >
            <option value="" disabled>
              اختر الكلية التابعة للجامعة
            </option>
            {faculties
              .filter((f) => f.universityId === inst?.universityId)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>
        </label>
      )}
      {!organizationOnly && officer && (
        <label>
          الاتحاد أو النشاط
          <select
            aria-label="الاتحاد أو النشاط"
            name="organizationId"
            key={`${institutionId}-${facultyId}-${current}`}
            required
            defaultValue=""
            disabled={!facultyId}
          >
            <option value="" disabled>
              اختر المجموعة المتاحة
            </option>
            {organizations
              .filter(
                (o) =>
                  o.institutionId === institutionId &&
                  o.facultyId === facultyId &&
                  o.kind === current,
              )
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
          </select>
        </label>
      )}
      {!organizationOnly && (
        <label>
          المنصب
          <select
            aria-label="المنصب"
            name="position"
            key={current}
            defaultValue={officer ? 'member' : 'representative'}
          >
            {(officer ? ['member'] : ['representative']).map((k) => (
              <option key={k} value={k}>
                {positionLabel(current, k)}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
export function AddAgentForm({
  ownDepartment,
  institutions,
  faculties,
  organizations,
  platform = false,
}: {
  institutions: ScopeInstitution[];
  faculties: ScopeFaculty[];
  organizations: ScopeOrganization[];
  platform?: boolean;
  ownDepartment?: string;
}) {
  const [state, action, pending] = useActionState(addInstitutionAgent, initial);
  const [createAccount, setCreateAccount] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(
    platform ? 'student_affairs' : ownDepartment || 'student_union',
  );
  return (
    <form action={action} className="form-stack">
      <ScopeFields
        institutions={institutions}
        faculties={faculties}
        organizations={organizations}
        platform={platform}
        ownDepartment={ownDepartment}
        onDepartmentChange={setSelectedDepartment}
      />
      <label>
        {['student_union', 'student_activity'].includes(selectedDepartment)
          ? 'بريد حساب الطالب'
          : 'بريد حساب الوكيل المسجل'}
        <input name="email" type="email" dir="ltr" maxLength={254} required />
      </label>
      {platform && !['student_union', 'student_activity'].includes(selectedDepartment) && (
        <>
          <label className="checkbox">
            <input
              type="checkbox"
              name="createAccount"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
            />
            إنشاء حساب دخول جديد للوكيل
          </label>
          {createAccount && (
            <fieldset className="portal-form-section">
              <legend>حساب جديد، لا يغيّر أي حساب موجود</legend>
              <label>
                اسم الوكيل
                <input
                  name="displayName"
                  minLength={2}
                  maxLength={100}
                  required
                  autoComplete="off"
                />
              </label>
              <label>
                كلمة مرور الحساب الجديد
                <input
                  name="newPassword"
                  type="password"
                  minLength={12}
                  maxLength={128}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                تأكيد كلمة مرور الحساب الجديد
                <input
                  name="confirmPassword"
                  type="password"
                  minLength={12}
                  maxLength={128}
                  required
                  autoComplete="new-password"
                />
              </label>
              <p className="form-hint">
                لا تُكتب كلمات المرور في الرسائل أو الملاحظات، احتفظ بها في مدير كلمات مرور وشاركها
                عبر قناة آمنة، التعيين يبقى بانتظار التفعيل اليدوي.
              </p>
            </fieldset>
          )}
        </>
      )}
      {platform && (
        <label className="checkbox">
          <input name="isSuperAgent" type="checkbox" />
          سوبر ايجنت داخل النطاق المحدد فقط
        </label>
      )}
      <p className="form-hint">
        السوبر يدير الوكلاء داخل نطاقه، ولا يتجاوز صلاحيات الأقسام المحددة له، لا يغيّر تفعيل الحساب
        ولا يمتد للقطاع الخاص أو مؤسسة أو كلية أو قسم آخر.
      </p>
      {['student_union', 'student_activity', 'private_sector'].includes(selectedDepartment) ? (
        <SectionPermissionFields
          activity={selectedDepartment === 'student_activity'}
          privateSector={selectedDepartment === 'private_sector'}
          value={{ canRead: true, canEdit: false, canPublish: false }}
        />
      ) : (
        <PermissionFields />
      )}
      <p className="form-hint">
        اربط حسابًا مسجلًا، أو أنشئ حسابًا جديدًا من خيار أدمن المنصة، الإضافة لا ترسل بريدًا ولا تفعّل
        التعيين؛ التفعيل خطوة مستقلة، شؤون الطلاب يضيف مسؤولي اتحاد وأنشطة كليته فقط.
      </p>
      <State state={state} />
      <Submit
        pending={pending}
        label={
          ['student_union', 'student_activity'].includes(selectedDepartment)
            ? 'منح صلاحية Coordinator'
            : 'إضافة الوكيل للمراجعة'
        }
      />
    </form>
  );
}
export type AgentReviewValue = {
  id: string;
  department: string;
  position: string;
  status: string;
  canRead: boolean;
  canEdit: boolean;
  canPublish: boolean;
  isSuperAgent?: boolean;
  sectionPermissions?: SectionPermissions | null;
};
export function AgentReviewForm({
  agent,
  platform = false,
}: {
  agent: AgentReviewValue;
  platform?: boolean;
}) {
  const [state, action, pending] = useActionState(updateInstitutionAgent, initial);
  const officer = ['student_union', 'student_activity'].includes(agent.department);
  return (
    <form action={action} className="form-stack compact-review">
      <input type="hidden" name="id" value={agent.id} />
      <label>
        المنصب
        <select aria-label="المنصب" name="position" defaultValue={agent.position}>
          {(officer ? [agent.position] : ['representative']).map((k) => (
            <option key={k} value={k}>
              {positionLabel(agent.department, k)}
            </option>
          ))}
        </select>
      </label>
      {platform ? (
        <label>
          حالة التفعيل
          <select aria-label="حالة التفعيل" name="status" defaultValue={agent.status}>
            {Object.entries(agentStatusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="status" value={agent.status} />
      )}
      {platform && (
        <label className="checkbox">
          <input name="isSuperAgent" type="checkbox" defaultChecked={agent.isSuperAgent} />
          سوبر ايجنت داخل النطاق
        </label>
      )}
      {officer || agent.department === 'private_sector' ? (
        <SectionPermissionFields
          activity={agent.department === 'student_activity'}
          privateSector={agent.department === 'private_sector'}
          value={agent}
        />
      ) : (
        <PermissionFields value={agent} />
      )}
      <State state={state} />
      <Submit pending={pending} label="تأكيد الصلاحيات" />
    </form>
  );
}
export function OrganizationForm({
  institutions,
  faculties,
}: {
  institutions: ScopeInstitution[];
  faculties: ScopeFaculty[];
}) {
  const [state, action, pending] = useActionState(saveStudentOrganization, initial);
  return (
    <form action={action} className="form-stack">
      <ScopeFields
        institutions={institutions.filter((i) => i.kind === 'university')}
        faculties={faculties}
        organizations={[]}
        organizationOnly
      />
      <label>
        نوع المجموعة
        <select aria-label="نوع المجموعة" name="kind" defaultValue="student_activity">
          <option value="student_activity">نشاط طلابي</option>
        </select>
      </label>
      <p className="form-hint">
        اتحاد الطلاب موجود افتراضيًا لكل كلية، شؤون الطلاب تضيف الأنشطة الطلابية فقط.
      </p>
      <label>
        اسم النشاط الطلابي
        <input name="name" minLength={2} maxLength={160} required />
      </label>
      <label className="checkbox">
        <input type="checkbox" name="active" defaultChecked />
        المجموعة متاحة
      </label>
      <State state={state} />
      <Submit pending={pending} label="إنشاء النشاط الطلابي" />
    </form>
  );
}
export function DomainContentForm({
  scopeOptions,
  value,
  canPublish,
}: {
  value?: { id: string; title: string; body: string; published: boolean };
  canPublish: boolean;
  scopeOptions?: {
    institutions: ScopeInstitution[];
    faculties: ScopeFaculty[];
    organizations: ScopeOrganization[];
  };
}) {
  const [state, action, pending] = useActionState(saveDomainContent, initial);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={value?.id || ''} />
      {scopeOptions && !value && <ScopeFields {...scopeOptions} platform />}
      <label>
        عنوان محتوى القسم
        <input name="title" minLength={2} maxLength={160} defaultValue={value?.title} required />
      </label>
      <label>
        المحتوى
        <textarea
          name="body"
          minLength={10}
          maxLength={20000}
          rows={8}
          defaultValue={value?.body}
          required
        />
      </label>
      {canPublish ? (
        <label className="checkbox">
          <input type="checkbox" name="published" defaultChecked={value?.published} />
          نشر للطلاب المؤهلين في النطاق
        </label>
      ) : (
        <p className="form-hint">لديك صلاحية المسودات فقط، لا يمكنك النشر أو تعديل محتوى منشور.</p>
      )}
      <State state={state} />
      <Submit pending={pending} label="حفظ محتوى القسم" />
    </form>
  );
}
