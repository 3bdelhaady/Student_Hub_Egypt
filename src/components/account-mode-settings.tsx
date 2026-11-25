import { isCoordinator } from '@/modules/institution/policy';
import { setAccountMode } from '@/modules/identity/actions';
import { GraduationCap, BriefcaseBusiness } from 'lucide-react';
import type { viewer } from '@/lib/session';
export function AccountModeSettings({
  v,
  modeError,
  locale = 'ar',
}: {
  v: NonNullable<Awaited<ReturnType<typeof viewer>>>;
  modeError?: string;
  locale?: 'ar' | 'en';
}) {
  const t = (ar: string, en: string) => (locale === 'en' ? en : ar);
  const coordinator = isCoordinator(v.institutionAgent?.department);
  const role = coordinator ? 'Coordinator' : t('وكيل', 'Agent');
  const dualAccount = v.membership?.role === 'student' && !!v.institutionAgent;
  const eligible =
    !!v.institutionAgent && v.institutionAgent.status === 'active' && v.institutionAgent.canRead;
  return (
    <>
      {' '}
      {dualAccount && (
        <div className="panel mode-settings">
          <h2>{t('نوع الحساب', 'Account mode')}</h2>
          <p>
            {t(
              'نفس البريد وكلمة المرور، وواجهتان حسب نوع الاستخدام.',
              'One sign-in, two workspaces.',
            )}
          </p>
          {modeError && (
            <p role="alert" className="form-error">
              {t(
                'وضع العمل غير متاح دون تعيين مفعّل ومؤسسة متاحة، لم تتغير صلاحياتك.',
                'Agent mode requires an active assignment and available institution; your permissions have not changed.',
              )}
            </p>
          )}
          <form action={setAccountMode}>
            <div className="mode-options">
              <label className={v.activeMode === 'student' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="mode"
                  value="student"
                  defaultChecked={v.activeMode === 'student'}
                  required
                />
                <GraduationCap />
                <span>
                  <strong>{t('طالب', 'Student')}</strong>
                  <small>
                    {t('المقررات ومجتمعك وحسابك الشخصي', 'Courses, community and personal profile')}
                  </small>
                </span>
              </label>
              <label
                className={`${v.activeMode === 'agent' ? 'selected' : ''} ${eligible ? '' : 'unavailable'}`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="agent"
                  defaultChecked={v.activeMode === 'agent' && eligible}
                  disabled={!eligible}
                />
                <BriefcaseBusiness />
                <span>
                  <strong>{role}</strong>
                  <small>
                    {eligible
                      ? t(
                          'لوحة العمل في حدود الصلاحيات الممنوحة',
                          'Workspace within your granted permissions',
                        )
                      : t(
                          'متاح فقط بعد منح الصلاحية وتفعيلها',
                          'Requires an active agent assignment',
                        )}
                  </small>
                </span>
              </label>
            </div>
            <button type="submit" className="button primary">
              {t('حفظ نوع الحساب', 'Save account mode')}
            </button>
          </form>
          <p className="form-hint">
            {t(
              'التبديل لا يمنح صلاحيات جديدة، ولا يغيّر تفعيل عضويتك أو نطاق كليتك، إذا أُوقف تعيينك فلن تستطيع فتح لوحة العمل.',
              'Switching does not add permissions or change membership activation or faculty scope; suspended assignments cannot open the agent workspace.',
            )}
          </p>
        </div>
      )}
    </>
  );
}
