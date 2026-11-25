import { currentLocale } from '@/modules/shared/locale';
import { hasSectionRight } from '@/modules/institution/section-policy';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeBoot } from '@/components/appearance-settings';
import { ApplicationFrame } from '@/components/application-frame';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { viewer } from '@/lib/session';
import { canReadAcademic } from '@/lib/policy';
import { publicCourses } from '@/modules/content/queries';
import { savedCourseNavigation } from '@/modules/learning/queries';
export const metadata: Metadata = {
  title: { default: 'Student Hub Egypt | مجتمعك الجامعي', template: '%s | Student Hub' },
  description: 'مجتمع جامعي يقوده الطلاب، مقررات منظمة وأخبار وفرص في مكان واحد.',
};
export const dynamic = 'force-dynamic';
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await currentLocale();
  const v = await viewer();
  const saved = v && !isAgentMode(v) ? await savedCourseNavigation(v.user.id) : [];
  const available = v && !isAgentMode(v) && !saved.length ? await publicCourses() : [];
  const ownCourses = available.filter((c) => canReadAcademic(v?.membership, c.universityId));
  const courses = saved.length
    ? saved
    : (ownCourses.length ? ownCourses : available).map((c) => ({ id: c.id, title: c.title }));
  return (
    <html lang={locale} dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <body>
        <ThemeBoot />
        <a className="skip" href="#main">
          {locale === 'en' ? 'Skip to content' : 'انتقل إلى المحتوى'}
        </a>
        <ApplicationFrame
          locale={locale}
          identity={
            v
              ? {
                  name: v.user.name,
                  platformAdmin: v.platformAdmin,
                  agent: isAgentMode(v),
                  affairs: v.institutionAgent?.department === 'student_affairs',
                  organizationAgent: ['student_union', 'student_activity'].includes(
                    v.institutionAgent?.department || '',
                  ),
                  privateSector: v.institutionAgent?.department === 'private_sector',
                  commerceSections: ['product', 'housing', 'restaurant', 'ticket'].filter(
                    (kind) =>
                      hasSectionRight(v.institutionAgent, kind, 'canRead') ||
                      (kind === 'ticket' && hasSectionRight(v.institutionAgent, 'trip', 'canRead')),
                  ),
                  supportUnit: v.institutionAgent?.department !== 'private_sector',
                  academic:
                    v.institutionAgent?.status === 'active' &&
                    hasSectionRight(v.institutionAgent, 'academic', 'canRead'),
                  social:
                    v.institutionAgent?.status === 'active' &&
                    hasSectionRight(v.institutionAgent, 'social', 'canRead'),
                  activeMode: v.activeMode,
                }
              : null
          }
          courses={courses}
          fallbackCourses={!saved.length}
        >
          {children}
        </ApplicationFrame>
      </body>
    </html>
  );
}
