const landingEnglish: Record<string, string> = {
  'منصتك للحياة الجامعية': 'Your campus life, connected',
  'مرحبًا بك في': 'Welcome to',
  'مركز الطلابية': 'Student Hub',
  'بوابتك المتكاملة لتجربة جامعية أغنى، من الموارد الأكاديمية إلى أخبار مجتمعك وفرص التعلم، هنا تبدأ خطوتك القادمة.':
    'Your starting point for a richer campus experience, with academic resources, community news and opportunities to learn.',
  'ابدأ رحلتك الآن': 'Start your journey',
  'استكشف خدماتنا': 'Explore our services',
  معًا: 'Together',
  'مجتمع يبدأ بك': 'A community starts with you',
  'نتعلم، نتشارك، ونكبر معًا.': 'Learn, share and grow together.',
  'الطلاب أولًا': 'Students first',
  'مساحتك الجامعية، منظمة': 'Your campus life, organized',
  'المعرفة والفرص في مكان واحد': 'Knowledge and opportunities in one place',
  'نتعلم معًا': 'Learning together',
  'من نحن': 'About us',
  'مركز الطلابية مساحة للطلاب في الجامعات المصرية، ونربط المعرفة بالمجتمع، ونبني تجربة تعلّم أسهل وأكثر تعاونًا.':
    'Student Hub is a space for students at Egyptian universities, connecting knowledge with community for easier, more collaborative learning.',
  'شبكة تواصل واسعة': 'A connected community',
  'تعرّف على فكرة المجتمع': 'Get to know our community',
  رؤيتنا: 'Our vision',
  'أن يجد كل طالب طريقًا واضحًا للمعرفة والفرص، في مجتمع يسانده طوال رحلته الجامعية.':
    'A clear path to knowledge and opportunity for every student, supported by a community throughout university life.',
  رسالتنا: 'Our mission',
  'تنظيم الموارد التعليمية، وتشجيع المشاركة، وإتاحة المعرفة بمساواة للطلاب.':
    'Organize learning resources, encourage participation and make knowledge equally available to students.',
  'خدمات المتجر': 'Campus store',
  'احتياجاتك الجامعية وخدمات حياتك الطلابية في مكان واحد.':
    'Your campus essentials and student services in one place.',
  'المتجر الرئيسي': 'Main store',
  'استكشف الأدوات والموارد الأكاديمية المعروضة، وتابع طلبك مع المسؤول.':
    'Browse academic tools and resources, then track your request with the team.',
  'تسوق الآن': 'Browse the store',
  'تذاكر إلكترونية': 'E-tickets',
  'استكشف الفعاليات المتاحة وأرسل طلبك للمراجعة.':
    'Browse available events and submit a request for review.',
  'سكن طلاب': 'Student housing',
  'ابحث عن خيارات السكن الطلابي المتاحة.': 'Find available student housing options.',
  'مطاعم وكافيهات': 'Restaurants and cafes',
  'تعرّف على عروض المطاعم والخدمات المتاحة.': 'Discover restaurant offers and available services.',
  'ابدأ من مجتمعك': 'Start with your community',
  'المجتمع الجامعي': 'University community',
  'الجامعات الموجودة على منصتنا، ومعلومة عن بداية كل جامعة.':
    'Universities on our platform and a short fact about their beginnings.',
  'خدماتنا الأساسية': 'Core services',
  'خدمات تدعم مسيرتك التعليمية والمهنية ومشاركتك في المجتمع.':
    'Services for learning, career development and community participation.',
  'الفريق الأكاديمي': 'Academic teams',
  'ابحث عن فريق دراسي وتواصل مع مجتمعك الأكاديمي.':
    'Find a study team and connect with your academic community.',
  'مركز التعلم': 'Learning center',
  'استكشف المقررات والمحاضرات والموارد التعليمية المنظمة.':
    'Browse organized courses, lectures and learning resources.',
  'الأنشطة التطوعية': 'Volunteering',
  'استكشف الأنشطة التطوعية وفرص المشاركة داخل مجتمعك.':
    'Explore volunteering and ways to contribute to your community.',
  'صوت الطالب': 'Student voice',
  'شارك برأيك في التصويت والاستبيانات المتاحة لمجتمعك.':
    'Have your say in community polls and surveys.',
  'بوابة التحقق': 'Certificate review',
  'أرسل طلب مراجعة أو استفسار عن شهادة إلى المسؤول المختص.':
    'Send a certificate review request or question to the responsible team.',
  'رابط الطلاب': 'Student Link',
  'تابع الخدمات والفرص وأرسل طلبك إلى المسؤول.':
    'Explore services and opportunities, then submit your request.',
};
import { currentLocale } from '@/modules/shared/locale';
import { platformCounts } from '@/modules/catalog/platform-counts';
import { studentAreaViewer } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Rocket,
  Compass,
  BookOpen,
  Users,
  ShieldCheck,
  Target,
  Eye,
  Network,
  Ticket,
  Building2,
  Utensils,
  HandHeart,
  Megaphone,
  Link2,
} from 'lucide-react';
import { listUniversities } from '@/modules/catalog/queries';
import { LandingContact } from '@/components/landing-contact';
import { UniversityCarousel } from '@/components/university-carousel';
import { campusPresence } from '@/modules/catalog/campus-presence';
import { PublicStatistics } from '@/components/public-statistics';
export default async function Home() {
  const viewer = await studentAreaViewer();
  if (viewer) redirect('/account?landing=1');
  const locale = await currentLocale();
  const counts = await platformCounts();
  const t = (ar: string, en: string) => (locale === 'en' ? en : ar);
  const destination = (href: string) =>
    viewer ? href : '/register?next=' + encodeURIComponent(href);
  const universities = await listUniversities();
  return (
    <div className="reference-home">
      <section className="reference-hero">
        <div className="container reference-hero-grid">
          <div className="reference-copy">
            <span className="overline">
              <span className="live-dot" />
              {t('منصتك للحياة الجامعية', 'Your campus life, connected')}
            </span>
            <h1>
              {t('مرحبًا بك في', 'Welcome to')}
              <br />
              <span>{t('مركز الطلابية', 'Student Hub')}</span>
            </h1>
            <p>
              {t(
                'بوابتك المتكاملة لتجربة جامعية أغنى، من الموارد الأكاديمية إلى أخبار مجتمعك وفرص التعلم، هنا تبدأ خطوتك القادمة.',
                'Your starting point for a richer campus experience, with academic resources, community news and opportunities to learn.',
              )}
            </p>
            <div className="hero-actions">
              <Link href="/register" className="button primary large">
                {t('ابدأ رحلتك الآن', 'Start your journey')}
                <Rocket size={19} />
              </Link>
              <a href="#core-services" className="button secondary large">
                {t('استكشف خدماتنا', 'Explore our services')}
                <Compass size={19} />
              </a>
            </div>
            <div className="reference-community">
              <span className="reference-avatar-stack" aria-hidden="true">
                <Image src="/design/avatar-three.jpg" alt="" width={42} height={42} />
                <Image src="/design/avatar-two.jpg" alt="" width={42} height={42} />
                <Image src="/design/avatar-one.jpg" alt="" width={42} height={42} />
                <span>{t('معًا', 'Together')}</span>
              </span>
              <div>
                <strong>{t('مجتمع يبدأ بك', 'A community starts with you')}</strong>
                <span>{t('نتعلم، نتشارك، ونكبر معًا.', 'Learn, share and grow together.')}</span>
              </div>
              <span className="reference-pill">{t('الطلاب أولًا', 'Students first')}</span>
            </div>
          </div>
          <figure className="reference-photo">
            <Image
              src="/design/blue-robot-hero.jpg"
              alt="روبوت أزرق بسماعات يستخدم حاسوبًا محمولًا"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 45vw"
            />
            <figcaption>
              <ShieldCheck size={28} />
              <div>
                <strong>{t('مساحتك الجامعية، منظمة', 'Your campus life, organized')}</strong>
                <span>
                  {t('المعرفة والفرص في مكان واحد', 'Knowledge and opportunities in one place')}
                </span>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="reference-about-section" id="about">
        <div className="section container reference-about">
          <div>
            <span className="eyebrow">{t('نتعلم معًا', 'Learning together')}</span>
            <h2>{t('من نحن', 'About us')}</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{`مركز الطلاب هي المظلة الأكبر للطلاب في مصر،
نسعى لخلق بيئة تعليمية واجتماعية متكاملة
تدعم الطالب في كافة مراحل حياته الجامعية.`}</p>
            <Link href="/about" className="reference-network">
              <Network size={29} aria-hidden="true" />
              <strong>{t('شبكة تواصل واسعة', 'A connected community')}</strong>
              <span>
                {t('تعرّف على فكرة المجتمع', 'Get to know our community')}
                <ArrowLeft size={15} aria-hidden="true" />
              </span>
            </Link>
          </div>
          <article className="reference-value">
            <Eye aria-hidden="true" />
            <h3>{t('رؤيتنا', 'Our vision')}</h3>
            <p>
              {t(
                'أن يجد كل طالب طريقًا واضحًا للمعرفة والفرص، في مجتمع يسانده طوال رحلته الجامعية.',
                'A clear path to knowledge and opportunity for every student, supported by a community throughout university life.',
              )}
            </p>
          </article>
          <article className="reference-value">
            <Target aria-hidden="true" />
            <h3>{t('رسالتنا', 'Our mission')}</h3>
            <p>
              {t(
                'تنظيم الموارد التعليمية، وتشجيع المشاركة، وإتاحة المعرفة بمساواة للطلاب.',
                'Organize learning resources, encourage participation and make knowledge equally available to students.',
              )}
            </p>
          </article>
        </div>
      </section>
      <section className="section reference-soft" id="services">
        <div className="container">
          <div className="reference-title">
            <h2>{t('خدمات المتجر', 'Campus store')}</h2>
            <p>
              {t(
                'احتياجاتك الجامعية وخدمات حياتك الطلابية في مكان واحد.',
                'Your campus essentials and student services in one place.',
              )}
            </p>
          </div>
          <div className="reference-services">
            <Link href={destination('/store')} className="reference-service reference-service-main">
              <div>
                <h3>{t('المتجر الرئيسي', 'Main store')}</h3>
                <p>
                  {t(
                    'استكشف الأدوات والموارد الأكاديمية المعروضة، وتابع طلبك مع المسؤول.',
                    'Browse academic tools and resources, then track your request with the team.',
                  )}
                </p>
                <span className="button white">
                  {t('تسوق الآن', 'Browse the store')}
                  <ArrowLeft size={17} />
                </span>
              </div>
            </Link>
            <Link
              href={destination('/store?kind=ticket')}
              className="reference-service reference-service-mint"
            >
              <div>
                <h3>{t('تذاكر إلكترونية', 'E-tickets')}</h3>
                <p>
                  {t(
                    'استكشف الفعاليات المتاحة وأرسل طلبك للمراجعة.',
                    'Browse available events and submit a request for review.',
                  )}
                </p>
              </div>
              <Ticket size={32} aria-hidden="true" />
            </Link>
            <Link
              href={destination('/store?kind=housing')}
              className="reference-service reference-service-small"
            >
              <Building2 size={30} aria-hidden="true" />
              <h3>{t('سكن طلاب', 'Student housing')}</h3>
              <p>
                {t(
                  'ابحث عن خيارات السكن الطلابي المتاحة.',
                  'Find available student housing options.',
                )}
              </p>
            </Link>
            <Link
              href={destination('/store?kind=restaurant')}
              className="reference-service reference-service-small"
            >
              <Utensils size={30} aria-hidden="true" />
              <h3>{t('مطاعم وكافيهات', 'Restaurants and cafes')}</h3>
              <p>
                {t(
                  'تعرّف على عروض المطاعم والخدمات المتاحة.',
                  'Discover restaurant offers and available services.',
                )}
              </p>
            </Link>
          </div>
        </div>
      </section>
      <section className="home-community-section" id="university-community">
        <div className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t('ابدأ من مجتمعك', 'Start with your community')}</span>
              <h2>{t('المجتمع الجامعي', 'University community')}</h2>
              <p>
                {t(
                  'الجامعات الموجودة على منصتنا، ومعلومة عن بداية كل جامعة.',
                  'Universities on our platform and a short fact about their beginnings.',
                )}
              </p>
            </div>
          </div>
          <UniversityCarousel
            universities={universities
              .filter((u) => u.id in campusPresence)
              .map((u) => ({ ...u, fact: campusPresence[u.id].fact }))}
          />
        </div>
      </section>
      <PublicStatistics {...counts} locale={locale} />
      <section className="section container" id="core-services">
        <div className="reference-title">
          <h2>{t('خدماتنا الأساسية', 'Core services')}</h2>
          <p>
            {t(
              'خدمات تدعم مسيرتك التعليمية والمهنية ومشاركتك في المجتمع.',
              'Services for learning, career development and community participation.',
            )}
          </p>
        </div>
        <div className="landing-core-grid">
          {[
            [
              BookOpen,
              'الفريق الأكاديمي',
              'ابحث عن فريق دراسي وتواصل مع مجتمعك الأكاديمي.',
              '/services?kind=team',
            ],
            [
              Users,
              'مركز التعلم',
              'استكشف المقررات والمحاضرات والموارد التعليمية المنظمة.',
              '/courses',
            ],
            [
              HandHeart,
              'الأنشطة التطوعية',
              'استكشف الأنشطة التطوعية وفرص المشاركة داخل مجتمعك.',
              '/services?kind=volunteer',
            ],
            [
              Megaphone,
              'صوت الطالب',
              'شارك برأيك في التصويت والاستبيانات المتاحة لمجتمعك.',
              '/services?kind=poll',
            ],
            [
              ShieldCheck,
              'بوابة التحقق',
              'أرسل طلب مراجعة أو استفسار عن شهادة إلى المسؤول المختص.',
              '/services?kind=certificate',
            ],
            [
              Link2,
              'رابط الطلاب',
              'تابع الخدمات والفرص وأرسل طلبك إلى المسؤول.',
              '/services?kind=service',
            ],
          ].map(([Icon, title, body, href]) => {
            const I = Icon as typeof BookOpen;
            return (
              <Link
                href={destination(String(href))}
                className="landing-core-card"
                key={
                  locale === 'en' ? landingEnglish[String(title)] || String(title) : String(title)
                }
              >
                <span className="landing-core-icon">
                  <I size={26} aria-hidden="true" />
                </span>
                <h3>{String(title)}</h3>
                <p>
                  {locale === 'en' ? landingEnglish[String(body)] || String(body) : String(body)}
                </p>
                <span className="landing-core-arrow" aria-hidden="true">
                  <ArrowLeft size={17} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <LandingContact identity={null} />
    </div>
  );
}
