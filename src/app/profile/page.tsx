import { isAgentMode } from '@/modules/identity/mode-policy';
import { StudentCodeForm } from '@/components/student-code-form';
import { currentLocale, translate } from '@/modules/shared/locale';
import Link from 'next/link';
import { AppearanceSettings } from '@/components/appearance-settings';
import { ProfileForm } from '@/components/forms';
import { db } from '@/db';
import { studentProfiles, universities, faculties, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { StudentDetailsForm } from '@/components/portal-forms';
import { AccountModeSettings } from '@/components/account-mode-settings';
import { signOut } from '@/modules/identity/actions';
import { UserRound, LogOut } from 'lucide-react';
export const metadata = { title: 'الملف الشخصي' };
export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; modeError?: string }>;
}) {
  const locale = await currentLocale();
  const t = (ar: string, en: string) => translate(locale, ar, en);
  const params = await searchParams;
  const v = await requireViewer('/profile');

  const [p] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, v.user.id))
    .limit(1);
  const [u] = v.membership
    ? await db
        .select()
        .from(universities)
        .where(eq(universities.id, v.membership.universityId))
        .limit(1)
    : [];
  const staff = isAgentMode(v) || !!v.platformAdmin;
  const academicProfile = !v.platformAdmin && v.institutionAgent?.department !== 'private_sector';
  const facultyId = (staff ? v.institutionAgent?.facultyId : null) || v.membership?.facultyId;
  const [faculty] = facultyId
    ? await db
        .select({ name: faculties.name })
        .from(faculties)
        .where(eq(faculties.id, facultyId))
        .limit(1)
    : [];
  const [identity] = await db
    .select({ code: user.studentCode, gender: user.gender, kind: user.signupKind })
    .from(user)
    .where(eq(user.id, v.user.id))
    .limit(1);
  const facultyName = faculty?.name || v.membership?.faculty || '';
  if (staff && params.edit === 'name')
    return (
      <section className="profile-screen">
        <h1>تعديل اسم العرض</h1>
        <ProfileForm name={v.user.name} />
        <Link href="/profile">العودة إلى الملف الشخصي</Link>
      </section>
    );
  if (params.edit === 'details')
    return (
      <section className="profile-screen">
        <h1>بيانات التواصل والتقديم</h1>
        <StudentDetailsForm
          name={v.user.name}
          email={v.user.email}
          phone={p?.phone}
          level={p?.level}
          university={u?.name}
          faculty={facultyName}
        />
        <Link className="button secondary" href="/profile">
          العودة إلى الملف الشخصي
        </Link>
      </section>
    );
  return (
    <section className="profile-screen profile-summary">
      <h1>الملف الشخصي</h1>
      <div className="profile-card-header">
        <div className="profile-avatar">
          <UserRound size={44} />
        </div>
        <div>
          <span className="tag">
            {v.institutionAgent && v.membership?.role !== 'student'
              ? 'حساب وكيل'
              : v.membership?.status === 'active'
                ? t('طالب أكاديمي', 'Academic student')
                : t('حساب طالب', 'Student account')}
          </span>
          <h2>{v.user.name}</h2>
          <p>{academicProfile ? facultyName : ''}</p>
        </div>
      </div>
      <article className="portal-form-section">
        <h2>{staff ? 'بيانات الحساب' : t('بيانات الطالب', 'Student details')}</h2>
        <dl>
          <div>
            <dt>{t('الاسم', 'Name')}</dt>
            <dd>{v.user.name}</dd>
          </div>
          {academicProfile && (
            <div>
              <dt>{t('الكلية', 'Faculty')}</dt>
              <dd>{facultyName}</dd>
            </div>
          )}
        </dl>
      </article>
      {!staff && (
        <>
          <article className="portal-form-section">
            <h2>كرت مركز الطلاب</h2>
            <p>الرصيد المتاح: ٠٫٠٠ ج.م.</p>
            <Link href="/card" className="button secondary">
              الرصيد والمعاملات والاشتراكات
            </Link>
          </article>
          <article className="portal-form-section">
            <h2>كود الحساب</h2>
            {identity?.code ? (
              <>
                <p dir="ltr" data-testid="student-code">
                  {identity.code}
                </p>
                <p>
                  النوع:{' '}
                  {identity.gender === 'male'
                    ? 'ولد'
                    : identity.gender === 'female'
                      ? 'بنت'
                      : 'غير محدد'}
                </p>
              </>
            ) : (
              <StudentCodeForm
                requiredGender={
                  !v.platformAdmin &&
                  identity?.kind === 'student' &&
                  (!v.institutionAgent || v.membership?.role === 'student')
                }
              />
            )}
          </article>
          <article className="portal-form-section">
            <h2>إعدادات الحساب</h2>
            <p dir="ltr">{v.user.email}</p>
            {v.membership?.role === 'student' || !v.institutionAgent ? (
              <Link className="button secondary" href="/profile?edit=details">
                تعديل بيانات التواصل والتقديم
              </Link>
            ) : (
              <ProfileForm name={v.user.name} />
            )}
          </article>
        </>
      )}
      {staff && (
        <Link className="text-link" href="/profile?edit=name">
          تعديل اسم العرض
        </Link>
      )}
      <AppearanceSettings locale={locale} />
      <AccountModeSettings locale={locale} v={v} modeError={params.modeError} />

      {(!v.institutionAgent || v.membership?.role === 'student') &&
        v.membership?.status !== 'active' && (
          <div className="notice">
            <p>
              {t(
                'يمكنك متابعة حالة العضوية أو استكمال طلب التفعيل من مساحتك الجامعية.',
                'Track membership or complete your activation request from your student workspace.',
              )}
            </p>
            <Link className="button secondary" href="/account?view=student">
              {t('متابعة طلب تفعيل الحساب', 'Track account activation')}
            </Link>
          </div>
        )}

      <form action={signOut} className="profile-signout">
        <button className="button secondary" type="submit">
          <LogOut size={16} />
          {t('تسجيل الخروج', 'Sign out')}
        </button>
      </form>
    </section>
  );
}
