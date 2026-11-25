import { FooterLanguageSwitch } from './footer-language-switch';
import type { Locale } from '@/modules/shared/locale';
import Link from 'next/link';
import { Brand } from './ui';
import { FooterThemeSwitch } from './footer-theme-switch';
import { FooterSocial } from './footer-social';
import { MessagesSquare, ShieldCheck, CircleHelp } from 'lucide-react';
export function Footer({ locale = 'ar' }: { locale?: Locale }) {
  const t = (ar: string, en: string) => (locale === 'en' ? en : ar);
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <h4>{t('روابط سريعة', 'Quick links')}</h4>
          <Link href="/">{t('الرئيسية', 'Home')}</Link>
          <Link href="/#about">{t('من نحن', 'About')}</Link>
          <Link href="/#core-services">{t('خدماتنا الأساسية', 'Core services')}</Link>
          <Link href="/#university-community">{t('المجتمع الجامعي', 'University community')}</Link>
        </div>
        <div>
          <h4>{t('الدعم', 'Support')}</h4>
          <Link href="/faq">{t('الأسئلة الشائعة', 'FAQ')}</Link>
          <Link href="/help">{t('الدعم الفني', 'Technical support')}</Link>
          <Link href="/privacy">{t('سياسة الخصوصية', 'Privacy policy')}</Link>
        </div>
        <div className="footer-contact">
          <h4>{t('تواصل معنا', 'Contact us')}</h4>
          <Link href="/#contact">
            <MessagesSquare size={16} aria-hidden="true" />{' '}
            {t('رسالة لفريق المنصة', 'Message the platform team')}
          </Link>
          <Link href="/help">
            <CircleHelp size={16} aria-hidden="true" />{' '}
            {t('فتح تذكرة دعم', 'Open a support ticket')}
          </Link>
          <Link href="/help?topic=privacy">
            <ShieldCheck size={16} aria-hidden="true" />{' '}
            {t('استفسار عن الخصوصية', 'Privacy inquiry')}
          </Link>
        </div>
        <div className="footer-brand">
          <Brand />
          <p>
            مساحة تجمع المعرفة والفرص والطلاب، نربط من خلالها الموارد الأكاديمية بالمجتمع الجامعي،
            ونقدم خدمات رقمية مصممة لتمكين الطلاب وتنمية قدراتهم، إيمانًا بأنهم قادة المستقبل وصُنّاع
            التغيير.
          </p>
          <FooterSocial />
        </div>
      </div>
      <div className="container footer-preferences">
        <FooterLanguageSwitch locale={locale} />
        <FooterThemeSwitch />
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Student Hub Egypt</span>
      </div>
    </footer>
  );
}
