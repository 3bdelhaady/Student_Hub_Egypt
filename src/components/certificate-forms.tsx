'use client';
import { useActionState, useState } from 'react';
import { ShieldCheck, Search, FileCheck2 } from 'lucide-react';
import {
  saveCertificate,
  importCertificates,
  deleteCertificate,
  verifyCertificate,
  type CertificateState,
} from '@/modules/portal/certificates-actions';
import { parseCertificateCsv, type CertificateInput } from '@/modules/portal/certificates-policy';
import {
  ScopeFields,
  type ScopeInstitution,
  type ScopeFaculty,
  type ScopeOrganization,
} from './institution-forms';
function Feedback({ state }: { state: CertificateState }) {
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
export function CertificateVerification() {
  const [state, action, pending] = useActionState(verifyCertificate, {});
  const [serial, setSerial] = useState('');
  return (
    <section className="certificate-gate">
      <header>
        <h1>بوابة التحقق من الشهادات</h1>
        <p>تحقق من سجل الشهادة لدى الجهة التي أضافته على المنصة.</p>
      </header>
      <div className="certificate-check-panel">
        <span className="certificate-shield">
          <ShieldCheck size={30} />
        </span>
        <h2>بدء عملية التحقق</h2>
        <p>أدخل السيريال الكامل المكتوب على الشهادة لعرض بيانات السجل المنشور.</p>
        <form action={action}>
          <label>
            الرقم التسلسلي للشهادة
            <input
              name="serial"
              dir="ltr"
              required
              minLength={12}
              maxLength={64}
              autoComplete="off"
              placeholder="CERT-…"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
            />
          </label>
          <button className="button primary" disabled={pending}>
            <Search size={17} />
            {pending ? 'جارٍ التحقق…' : 'تحقق الآن من البيانات'}
          </button>
        </form>
        <Feedback state={state} />
      </div>
      {state.result && (
        <article className="certificate-result" aria-label="تفاصيل الشهادة">
          <div className="section-heading">
            <h2>
              <FileCheck2 size={21} />
              تفاصيل الشهادة المسجلة
            </h2>
            <span className="tag">سجل منشور</span>
          </div>
          <dl>
            <div>
              <dt>اسم صاحب الشهادة</dt>
              <dd>{state.result.recipientName}</dd>
            </div>
            <div>
              <dt>عنوان الشهادة</dt>
              <dd>{state.result.certificateTitle}</dd>
            </div>
            <div>
              <dt>الجهة المسجلة</dt>
              <dd>{state.result.issuer}</dd>
            </div>
            <div>
              <dt>تاريخ الإصدار</dt>
              <dd>{state.result.issuedOn}</dd>
            </div>
            <div>
              <dt>السيريال</dt>
              <dd dir="ltr">{state.result.serial}</dd>
            </div>
          </dl>
        </article>
      )}
      <div className="certificate-principles">
        <article>
          <h3>تحقق بالرمز فقط</h3>
          <p>لا يوجد بحث بالاسم أو قائمة عامة ببيانات أصحاب الشهادات.</p>
        </article>
        <article>
          <h3>بيانات محدودة</h3>
          <p>
            من يعرف السيريال ويملك حسابًا يستطيع رؤية الاسم وعنوان الشهادة وتاريخها والجهة، دون الرقم
            القومي أو معلومات التواصل.
          </p>
        </article>
        <article>
          <h3>سجل الجهة المصدرة</h3>
          <p>
            وجود السجل ليس اعتمادًا حكوميًا أو تحققًا مستقلًا من صحة الشهادة، راجع الجهة عند وجود
            اختلاف.
          </p>
        </article>
      </div>
    </section>
  );
}
type ScopeProps = {
  ownScope?: {
    institutionId: string;
    facultyId: string | null;
    organizationId: string | null;
    department: string;
  };
  institutions: ScopeInstitution[];
  faculties: ScopeFaculty[];
  organizations: ScopeOrganization[];
};
function CertificateScope({ scope }: { scope: ScopeProps }) {
  return scope.ownScope ? (
    <>
      <p>الإضافة محصورة في جهتك وكليتك وتعيينك الحالي.</p>
      {Object.entries(scope.ownScope).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value || ''} />
      ))}
    </>
  ) : (
    <ScopeFields {...scope} platform />
  );
}
export function CertificateEditor({
  scope,
  record,
  canPublish,
}: {
  scope: ScopeProps;
  record?: {
    id: string;
    serial: string;
    recipientName: string;
    certificateTitle: string;
    issuedOn: string;
    published: boolean;
  };
  canPublish: boolean;
}) {
  const [state, action, pending] = useActionState(saveCertificate, {});
  const [recipientName, setRecipient] = useState(record?.recipientName || '');
  const [certificateTitle, setTitle] = useState(record?.certificateTitle || '');
  const [issuedOn, setDate] = useState(record?.issuedOn || '');
  const [serial, setSerial] = useState(record?.serial || '');
  return (
    <form action={action} className="form-stack certificate-editor">
      <input type="hidden" name="id" value={record?.id || ''} />
      {!record && <CertificateScope scope={scope} />}
      <label>
        اسم صاحب الشهادة
        <input
          name="recipientName"
          required
          minLength={2}
          maxLength={160}
          value={recipientName}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </label>
      <label>
        عنوان الشهادة
        <input
          name="certificateTitle"
          required
          minLength={2}
          maxLength={200}
          value={certificateTitle}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label>
        تاريخ الإصدار
        <input
          name="issuedOn"
          type="date"
          required
          value={issuedOn}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label>
        السيريال، اتركه فارغًا لتوليد رمز عشوائي
        <input
          name="serial"
          dir="ltr"
          minLength={12}
          maxLength={64}
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          readOnly={!!record}
        />
      </label>
      <p className="form-hint">
        استخدم رمزًا طويلًا يصعب تخمينه، وليس رقمًا قوميًّا أو رقم هاتف، السيريال ثابت بعد الإنشاء.
      </p>
      {canPublish && (
        <label className="checkbox">
          <input type="checkbox" name="published" defaultChecked={record?.published} />
          إتاحة التحقق بالسيريال لمن يملك حسابًا
        </label>
      )}
      <Feedback state={state} />
      <button className="button primary" disabled={pending}>
        حفظ سجل الشهادة
      </button>
    </form>
  );
}
export function CertificateCsvImport({
  scope,
  canPublish,
}: {
  scope: ScopeProps;
  canPublish: boolean;
}) {
  const [state, action, pending] = useActionState(importCertificates, {});
  const [csv, setCsv] = useState('');
  const [rows, setRows] = useState<CertificateInput[]>([]);
  const [error, setError] = useState('');
  return (
    <form action={action} className="form-stack certificate-import">
      <CertificateScope scope={scope} />
      <p>
        UTF-8 CSV بحد أقصى 200 صف و256 كيلوبايت، الأعمدة بالترتيب:{' '}
        <code dir="ltr">serial,recipientName,certificateTitle,issuedOn</code>، التاريخ YYYY-MM-DD،
        السيريال الفارغ يولد رمزًا عشوائيًا، الأعمدة الإضافية مرفوضة حتى لا تُستورد بيانات حساسة.
      </p>
      <label>
        ملف CSV
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            setRows([]);
            setError('');
            setCsv('');
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 256000) {
              setError('الملف أكبر من 256 كيلوبايت.');
              return;
            }
            try {
              const value = await file.text();
              const parsed = parseCertificateCsv(value);
              setCsv(value);
              setRows(parsed);
            } catch {
              setError('راجع ترتيب الأعمدة والبيانات والتواريخ والسيريالات المكررة.');
            }
          }}
        />
      </label>
      <input type="hidden" name="csv" value={csv} />
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {rows.length > 0 && (
        <>
          <h3>معاينة {rows.length} سجل قبل الاستيراد</h3>
          <div className="portal-table-wrap" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الشهادة</th>
                  <th>التاريخ</th>
                  <th>السيريال</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.recipientName}</td>
                    <td>{r.certificateTitle}</td>
                    <td>{r.issuedOn}</td>
                    <td dir="ltr">{r.serial || 'يولد تلقائيًا'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="checkbox">
            <input type="checkbox" name="confirmed" required />
            راجعت المعاينة ولدي صلاحية تسجيل بيانات هؤلاء الطلاب في هذا النطاق
          </label>
        </>
      )}
      {canPublish && (
        <label className="checkbox">
          <input type="checkbox" name="published" />
          إتاحة التحقق لسجلات الدفعة بالسيريال
        </label>
      )}
      <p className="form-hint">
        الاستيراد لا يستبدل أو يدمج سجلات قديمة، أي خطأ أو سيريال مكرر يلغي الدفعة كلها.
      </p>
      <Feedback state={state} />
      <button className="button primary" disabled={pending || !rows.length}>
        استيراد الدفعة بعد المراجعة
      </button>
    </form>
  );
}
export function CertificateDelete({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteCertificate, {});
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="id" value={id} />
      <label className="checkbox">
        <input type="checkbox" name="confirm" required />
        تأكيد حذف هذا السجل نهائيًا وإيقاف التحقق بسيرياله
      </label>
      <Feedback state={state} />
      <button className="button secondary" disabled={pending}>
        حذف سجل الشهادة
      </button>
    </form>
  );
}
