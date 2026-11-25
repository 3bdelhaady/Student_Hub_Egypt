'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  Bell,
  Settings,
  Menu,
  X,
  GraduationCap,
  BookOpen,
  UserRound,
  CircleHelp,
  Bookmark,
  ChevronLeft,
  ShoppingBag,
  Building2,
  Pencil,
  Users,
  HeartHandshake,
  FileBadge,
  Vote,
  Link2,
  ClipboardList,
  Ticket,
  Home,
  Coffee,
} from 'lucide-react';
import { Header } from './header';
import { Footer } from './footer';
type Identity = {
  name: string;
  platformAdmin: boolean;
  agent: boolean;
  affairs?: boolean;
  organizationAgent?: boolean;
  supportUnit?: boolean;
  privateSector?: boolean;
  commerceSections?: string[];
  academic?: boolean;
  social?: boolean;
  activeMode: string;
} | null;
export function ApplicationFrame({
  children,
  locale = 'ar',
  identity,
  courses,
  fallbackCourses = false,
}: {
  children: React.ReactNode;
  locale?: 'ar' | 'en';
  identity: Identity;
  courses: { id: string; title: string }[];
  fallbackCourses?: boolean;
}) {
  const labels: Record<string, string> = {
    'المقررات الدراسية': 'Academic courses',
    المتجر: 'Store',
    'الخدمات الأساسية': 'Student services',
    'النشرات الإخبارية': 'News',
    'التواصل والدعم': 'Help and support',
    'مركز الطلاب': 'Student Hub',
    حسابي: 'My profile',
    'إعدادات الحساب': 'Account settings',
    الإشعارات: 'Notifications',
    المقررات: 'Courses',
    الخدمات: 'Services',
    الإعدادات: 'Settings',
    'طلباتي ومتابعتها': 'My requests and tracking',
    'المتجر الأكاديمي': 'Academic store',
    'التذاكر الإلكترونية': 'E-tickets',
    'السكن الطلابي': 'Student housing',
    'المطاعم والكافيهات': 'Restaurants and cafes',
    'مركز التعلم': 'Learning center',
    'الفرق الأكاديمية': 'Academic teams',
    'التطوع والأنشطة': 'Volunteering and activities',
    'الشهادات والإيفادات': 'Certificates',
    'رابط الطلاب': 'Student Link',
    'صوت الطلاب': 'Student voice',
    'مساحة العمل الأكاديمية': 'Academic workspace',
    'قائمتك الأكاديمية': 'Your courses',
    'خدمات مجتمعك الجامعي': 'Your campus services',
    'كل احتياجاتك في مكان واحد': 'Student essentials',
    المحفوظات: 'Saved items',
    'تعديل المقررات الدراسية': 'Edit course bundle',
    مقرراتي: 'My courses',
    'أقسام الصفحة': 'Page sections',
    'فتح القائمة': 'Open menu',
    'إغلاق القائمة': 'Close menu',
  };
  const t = (text: string) => (locale === 'en' ? labels[text] || text : text);
  const path = usePathname();
  const query = useSearchParams();
  const [open, setOpen] = useState(false);
  const auth = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ].includes(path);
  const academic =
    !!identity &&
    ([
      '/account',
      '/student',
      '/settings',
      '/help',
      '/faq',
      '/notifications',
      '/store',
      '/services',
      '/learning',
      '/profile',
      '/card',
      '/requests',
    ].some((p) => path === p || path.startsWith(p + '/')) ||
      path.startsWith('/community') ||
      path.startsWith('/courses'));
  if (auth) return <main id="main">{children}</main>;
  if (identity?.agent && (identity.affairs || identity.organizationAgent)) {
    const sections = identity.affairs
      ? [
          ['/manage/students', 'تفعيل حسابات الطلاب', 'Student activation'],
          ['/manage/access', 'صلاحيات الاتحاد والأنشطة', 'Union and activity permissions'],
          ['/manage/social', 'إدارة قنوات التواصل', 'Social channels'],
          ['/manage/academic', 'مساحة العمل الأكاديمية', 'Academic workspace'],
          ['/manage/support', 'صندوق الواردات', 'Inbox'],
          ['/profile', 'الملف الشخصي', 'Profile'],
          ['/help', 'الدعم', 'Support'],
        ]
      : [
          ['/manage', 'لوحة التحكم', 'Dashboard'],
          ...(identity.social
            ? [['/manage/social', 'إدارة قنوات التواصل', 'Social channels']]
            : []),
          ...(identity.academic
            ? [['/manage/academic', 'مساحة العمل الأكاديمية', 'Academic workspace']]
            : []),
          ['/manage/support', 'صندوق الواردات', 'Inbox'],
          ['/profile', 'الملف الشخصي', 'Profile'],
          ['/help', 'الدعم', 'Support'],
        ];
    return (
      <div className="affairs-workspace">
        <aside
          className="affairs-sidebar"
          aria-label={identity.affairs ? 'مساحة شؤون الطلاب' : 'مساحة Coordinator'}
        >
          <Link
            href={identity.affairs ? '/manage/students' : '/agent'}
            className="workspace-wordmark"
          >
            {identity.affairs
              ? locale === 'en'
                ? 'Student affairs'
                : 'شؤون الطلاب'
              : locale === 'en'
                ? 'Coordinator workspace'
                : 'مساحة Coordinator'}
          </Link>
          <nav aria-label={identity.affairs ? 'أقسام شؤون الطلاب' : 'أقسام Coordinator'}>
            {sections.map(([href, ar, en]) => (
              <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
                {locale === 'en' ? en : ar}
              </Link>
            ))}
          </nav>
        </aside>
        <main id="main">{children}</main>
      </div>
    );
  }
  if (identity?.agent)
    return (
      <div className="agent-only-frame">
        <header className="workspace-header">
          <Link className="workspace-wordmark" href="/agent">
            مساحة الوكيل
          </Link>
          <nav className="agent-only-nav" aria-label="أقسام الوكيل">
            <Link href="/agent">لوحتي</Link>
            {identity.affairs ? (
              <Link href="/manage/access">صلاحيات الاتحاد والأنشطة</Link>
            ) : !identity.privateSector ? (
              <Link href="/manage">الخدمات والطلبات</Link>
            ) : null}
            {identity.academic && (
              <Link href="/manage/academic">{t('مساحة العمل الأكاديمية')}</Link>
            )}
            {identity.supportUnit && <Link href="/manage/support">صندوق الواردات</Link>}
            <Link href="/profile">{t('الملف الشخصي')}</Link>
            <Link href="/help">الدعم</Link>
          </nav>
        </header>
        {identity.privateSector ? (
          <div className="commerce-workspace">
            <aside className="commerce-sidebar" aria-label="أقسام لوحتي">
              <strong>إدارة المتجر</strong>
              <nav>
                {(identity.commerceSections || []).map((kind) => {
                  const label = (
                    {
                      product: 'المتجر الأكاديمي',
                      housing: 'السكن الطلابي',
                      restaurant: 'المطاعم والكافيهات',
                      ticket: 'التذاكر الإلكترونية',
                    } as Record<string, string>
                  )[kind];
                  const Icon =
                    (
                      {
                        product: ShoppingBag,
                        housing: Home,
                        restaurant: Coffee,
                        ticket: Ticket,
                      } as Record<string, typeof ShoppingBag>
                    )[kind] || ClipboardList;
                  return (
                    <Link
                      key={kind}
                      href={'/agent?kind=' + kind}
                      aria-current={
                        (query.get('kind') || identity.commerceSections?.[0]) === kind &&
                        ['/agent', '/manage'].includes(path)
                          ? 'page'
                          : undefined
                      }
                    >
                      <Icon size={20} />
                      {label || kind}
                    </Link>
                  );
                })}
              </nav>
            </aside>
            <main id="main">{children}</main>
          </div>
        ) : (
          <main id="main">{children}</main>
        )}
      </div>
    );
  if (path === '/agent') return <main id="main">{children}</main>;
  if (!academic)
    return (
      <>
        <Header signedIn={!!identity} locale={locale} />
        <main id="main">{children}</main>
        <Footer locale={locale} />
      </>
    );
  const links = [
    ['/courses', 'المقررات الدراسية'],
    ['/store', 'المتجر'],
    ['/services', 'الخدمات الأساسية'],
    ['/community', 'النشرات الإخبارية'],
    ['/help', 'التواصل والدعم'],
  ];
  const isCourse = path.startsWith('/courses');
  const store = path.startsWith('/store');
  const services = path.startsWith('/services') || path.startsWith('/learning');
  const sideLinks = store
    ? [
        ['/store', 'المتجر الأكاديمي'],
        ['/store?kind=ticket', 'التذاكر الإلكترونية'],
        ['/store?kind=housing', 'السكن الطلابي'],
        ['/store?kind=restaurant', 'المطاعم والكافيهات'],
        ['/requests', 'طلباتي ومتابعتها'],
      ]
    : services
      ? [
          ['/services', 'مركز التعلم'],
          ['/services?kind=team', 'الفرق الأكاديمية'],
          ['/services?kind=volunteer', 'التطوع والأنشطة'],
          ['/services?kind=certificate', 'الشهادات والإيفادات'],
          ['/services?kind=service', 'رابط الطلاب'],
          ['/services?kind=poll', 'صوت الطلاب'],
          ['/requests', 'طلباتي ومتابعتها'],
        ]
      : [];
  const sidebar = isCourse || store || services;
  return (
    <div className={`student-workspace ${sidebar ? 'has-academic-sidebar' : ''}`}>
      <header className="workspace-header">
        <Link className="workspace-wordmark" href="/">
          {t('مركز الطلاب')}
        </Link>
        <nav className="workspace-topnav" aria-label="القائمة الرئيسية">
          {links.map(([url, label]) => (
            <Link
              key={url}
              href={url}
              aria-current={
                path.startsWith(url) || (url === '/services' && path.startsWith('/learning'))
                  ? 'page'
                  : undefined
              }
            >
              {t(label)}
            </Link>
          ))}
        </nav>
        <div className="workspace-tools">
          <Link href="/notifications" aria-label={t('الإشعارات')}>
            <Bell size={18} />
          </Link>
          <Link href="/profile" aria-label={t('الملف الشخصي')}>
            <Settings size={18} />
          </Link>
          <Link href="/account?view=student" className="workspace-avatar" aria-label={t('حسابي')}>
            {identity.name.slice(0, 1)}
          </Link>
          <button
            className="workspace-menu"
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {open && (
        <nav className="workspace-mobile-nav" aria-label="قائمة الموبايل">
          {[...links, ['/account?view=student', 'حسابي'], ['/profile', 'الملف الشخصي']].map(
            ([url, label]) => (
              <Link key={url} href={url} onClick={() => setOpen(false)}>
                {t(label)}
                <ChevronLeft size={16} />
              </Link>
            ),
          )}
        </nav>
      )}
      <div className="workspace-layout">
        {sidebar && (
          <aside className="academic-sidebar">
            <div className="academic-sidebar-title">
              <span>
                <GraduationCap size={22} />
              </span>
              <div>
                <strong>
                  {t(
                    store
                      ? 'مركز الطلاب'
                      : services
                        ? 'الخدمات الأساسية'
                        : 'مساحة العمل الأكاديمية',
                  )}
                </strong>
                <small>
                  {t(
                    store
                      ? 'كل احتياجاتك في مكان واحد'
                      : services
                        ? 'خدمات مجتمعك الجامعي'
                        : 'قائمتك الأكاديمية',
                  )}
                </small>
              </div>
            </div>
            <nav aria-label={t(store || services ? 'أقسام الصفحة' : 'مقرراتي')}>
              {sideLinks.map(([url, label]) => {
                const [target, search] = url.split('?');
                const next = new URLSearchParams(search);
                const root = store ? '/store' : '/services';
                const targetKind = next.get('kind') || (store ? 'product' : '');
                if (target === root && !(services && !search)) {
                  if (store && !next.has('kind')) next.set('kind', 'product');
                  for (const key of ['saved', 'q', 'sort']) {
                    const value = query.get(key);
                    if (value) next.set(key, value);
                  }
                }
                const href = target === root && next.size ? `${target}?${next}` : url;
                const SideIcon =
                  target === '/requests'
                    ? ClipboardList
                    : store
                      ? {
                          product: ShoppingBag,
                          ticket: Ticket,
                          housing: Home,
                          restaurant: Coffee,
                        }[targetKind] || ShoppingBag
                      : {
                          team: Users,
                          volunteer: HeartHandshake,
                          certificate: FileBadge,
                          service: Link2,
                          poll: Vote,
                        }[targetKind] || BookOpen;
                const currentKind =
                  query.get('kind') || (store && !query.get('saved') ? 'product' : '');
                return (
                  <Link
                    href={href}
                    key={url}
                    className={target === '/requests' ? 'sidebar-request-tracking' : undefined}
                    aria-current={
                      (
                        path.startsWith('/learning')
                          ? target === '/services' && !search
                          : path === target && currentKind === targetKind
                      )
                        ? 'page'
                        : undefined
                    }
                  >
                    <SideIcon size={17} />
                    {t(label)}
                  </Link>
                );
              })}
              {isCourse && (
                <>
                  <Link href="/courses" aria-current={path === '/courses' ? 'page' : undefined}>
                    <BookOpen size={17} />
                    {t('المقررات الدراسية')}
                  </Link>
                  {!courses.length && (
                    <p className="academic-empty">
                      اختر المقررات التي تريدها في قائمتك من تعديل المقررات.
                    </p>
                  )}
                  {(fallbackCourses && query.get('view') === 'manage' ? [] : courses).map((c) => (
                    <Link
                      key={c.id}
                      href={`/courses/${c.id}`}
                      aria-current={path === `/courses/${c.id}` ? 'page' : undefined}
                    >
                      <span className="course-symbol">∑</span>
                      {c.title}
                    </Link>
                  ))}
                </>
              )}
            </nav>
            <Link
              href={
                store
                  ? '/store?saved=1'
                  : services
                    ? path.startsWith('/learning') ||
                      (!query.get('kind') && !query.get('saved') && !query.get('q'))
                      ? '/learning/new'
                      : '/requests'
                    : '/courses?view=manage' +
                      (path.startsWith('/courses/')
                        ? '&course=' + encodeURIComponent(path.split('/')[2])
                        : '')
              }
              className="academic-saved"
            >
              {isCourse ? <Pencil size={16} /> : <Bookmark size={16} />}
              {store
                ? 'المحفوظات'
                : services
                  ? path.startsWith('/learning') ||
                    (!query.get('kind') && !query.get('saved') && !query.get('q'))
                    ? 'أنشئ دورتك الخاصة'
                    : 'متابعة الطلبات'
                  : 'تعديل المقررات الدراسية'}
            </Link>
          </aside>
        )}
        <main id="main" className="workspace-main">
          {children}
        </main>
      </div>

      <nav className="workspace-bottom-nav" aria-label="التنقل السريع">
        <Link href="/courses" aria-current={isCourse ? 'page' : undefined}>
          <BookOpen size={20} />
          {t('المقررات')}
        </Link>
        <Link href="/store">
          <ShoppingBag size={20} />
          {t('المتجر')}
        </Link>
        <Link href="/services">
          <Building2 size={20} />
          {t('الخدمات')}
        </Link>
        <Link href="/profile">
          <UserRound size={20} />
          {t('الملف الشخصي')}
        </Link>
        <Link href="/help">
          <CircleHelp size={20} />
          المساعدة
        </Link>
      </nav>
    </div>
  );
}
