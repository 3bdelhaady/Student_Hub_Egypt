import { redirect } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { db } from '@/db';
import { studentProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { listUniversities, listFaculties } from '@/modules/catalog/queries';
import { StudentDetailsForm } from '@/components/portal-forms';
import { JoinForm } from '@/components/forms';
import { UserRound } from 'lucide-react';
export const metadata = { title: 'بيانات الطالب وتفعيل الحساب' };
const statuses: Record<string, string> = {
  active: 'مفعّل',
  pending: 'قيد المراجعة',
  rejected: 'لم تتم الموافقة',
  suspended: 'موقوف',
};
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; landing?: string; membershipIssue?: string }>;
}) {
  const v = await requireViewer();
  const params = await searchParams;
  if (isAgentMode(v)) redirect('/agent');
  if (v.institutionAgent && v.membership?.role !== 'student' && !v.platformAdmin)
    redirect('/agent');
  if (params.view !== 'student' && v.platformAdmin) redirect('/admin?tab=institutions');
  if (params.landing === '1') redirect('/courses');
  const [universities, faculties, profiles] = await Promise.all([
    listUniversities(),
    listFaculties(),
    db.select().from(studentProfiles).where(eq(studentProfiles.userId, v.user.id)).limit(1),
  ]);
  const m = v.membership,
    p = profiles[0];
  const university = universities.find((u) => u.id === m?.universityId)?.name;
  const faculty = faculties.find((f) => f.id === m?.facultyId)?.name || m?.faculty;
  return (
    <section className="profile-screen account-details-screen">
      <header className="profile-card-header">
        <div className="profile-avatar">
          <UserRound size={44} />
        </div>
        <div>
          <span className="tag">طالب أكاديمي</span>
          <h1>{v.user.name}</h1>
          <p>
            {m
              ? 'حالة عضويتك: ' + (statuses[m.status] || m.status)
              : 'أكمل بياناتك لإرسال طلب التفعيل'}
          </p>
        </div>
      </header>

      {params.membershipIssue && (
        <p role="alert" className="form-error">
          تم إنشاء حساب الدخول، لكن لم يصل طلب العضوية، اختر الجامعة والكلية وأرسل الطلب أدناه.
        </p>
      )}

      <StudentDetailsForm
        name={v.user.name}
        email={v.user.email}
        phone={p?.phone}
        level={p?.level}
        university={university}
        faculty={faculty}
      />

      {m ? (
        <div className="account-activation-status">
          <p className="membership-faculty">
            {university} · {faculty}
          </p>
          <p>
            {m.status === 'active'
              ? 'حسابك مفعّل بالفعل، لا تحتاج إلى طلب تفعيل جديد.'
              : m.status === 'pending'
                ? 'طلب التفعيل وصل وينتظر مراجعة شؤون الطلاب، لا تحتاج إلى إرساله مرة أخرى.'
                : 'حالة عضويتك تحتاج مراجعة شؤون الطلاب قبل الوصول للموارد الأكاديمية.'}
          </p>
        </div>
      ) : (
        <article className="portal-form-section">
          <h2>طلب تفعيل الحساب</h2>
          <JoinForm universities={universities} faculties={faculties} />
        </article>
      )}
    </section>
  );
}
