import Link from 'next/link';
import { VolunteerApplicationForm, type VolunteerDivision } from './volunteer-application-form';
import { volunteerApplicationsOpen } from '@/modules/volunteering/policy';
import { requestStatuses } from '@/modules/portal/policy';
import { studentLoginPath } from '@/modules/shared/return-path';
import { money } from './portal-catalog';
export function VolunteerApplicationPanel({
  entry,
  divisions,
  signedIn,
  returnPath,
  activeRequest,
  selectedDivision,
}: {
  entry: {
    id: string;
    title: string;
    capacity: number | null;
    closesAt: Date | null;
    priceMinor: number;
  };
  divisions: VolunteerDivision[];
  signedIn: boolean;
  returnPath: string;
  activeRequest?: { id: string; reference: string; status: string };
  selectedDivision?: string;
}) {
  const open = volunteerApplicationsOpen(entry);
  return (
    <section className="volunteer-panel volunteer-apply-panel" id="volunteer-apply">
      <header className="volunteer-panel-heading">
        <span className="volunteer-step">2</span>
        <h2>اختر القسم</h2>
      </header>
      <p className="volunteer-selected-name">{entry.title}</p>
      {entry.priceMinor > 0 && (
        <p className="volunteer-fee">
          رسوم منشورة: {money(entry.priceMinor)}، لا يتم خصم أموال هنا.
        </p>
      )}
      {activeRequest ? (
        <div className="volunteer-state">
          <h3>لديك طلب {requestStatuses[activeRequest.status]}</h3>
          {selectedDivision && <p>القسم عند إرسال الطلب: {selectedDivision}</p>}
          <p dir="ltr">{activeRequest.reference}</p>
          <Link className="button primary" href={'/requests/' + activeRequest.id}>
            متابعة طلبك الحالي
          </Link>
        </div>
      ) : !open ? (
        <div className="volunteer-state">
          <h3>التقديم مغلق حاليًا</h3>
          <p>راجع فرص التطوع الأخرى أو تابع طلباتك السابقة.</p>
        </div>
      ) : !divisions.length ? (
        <div className="volunteer-state">
          <h3>لم تحدد الجهة أقسامًا متاحة بعد</h3>
          <p>لا يمكن إرسال طلب جديد حتى تضيف الجهة قسمًا متاحًا للتقديم.</p>
        </div>
      ) : !signedIn ? (
        <div className="volunteer-state">
          <p>سجّل الدخول لاختيار القسم وإرسال طلبك للمراجعة.</p>
          <Link className="button primary" href={studentLoginPath(returnPath)}>
            تسجيل الدخول للتقديم
          </Link>
        </div>
      ) : (
        <VolunteerApplicationForm key={entry.id} entryId={entry.id} divisions={divisions} />
      )}
      {entry.capacity !== null && (
        <p className="volunteer-application-note">المتاح للتقديم: {entry.capacity}</p>
      )}
      {entry.closesAt && (
        <p className="volunteer-application-note">
          آخر موعد:{' '}
          {entry.closesAt.toLocaleString('ar-EG', {
            timeZone: 'Africa/Cairo',
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      )}
    </section>
  );
}
