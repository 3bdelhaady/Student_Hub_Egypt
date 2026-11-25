'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Brand } from './ui';
export function Header({
  signedIn = false,
  locale = 'ar',
}: {
  signedIn?: boolean;
  locale?: 'ar' | 'en';
}) {
  const labels: Record<string, string> = {
    الرئيسية: 'Home',
    'من نحن': 'About',
    الخدمات: 'Services',
    المتجر: 'Store',
    المجتمع: 'Community',
    'اتصل بنا': 'Contact us',
  };
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="container header-row">
        <Brand />
        <button
          className="menu-toggle"
          aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'nav open' : 'nav'} aria-label="القائمة الرئيسية">
          {[
            ['/', 'الرئيسية'],
            ['/#about', 'من نحن'],
            ['/#core-services', 'الخدمات'],
            [signedIn ? '/store' : '/register?next=%2Fstore', 'المتجر'],
            ['/community', 'المجتمع'],
            ['/#contact', 'اتصل بنا'],
          ].map(([href, label]) => (
            <Link
              onClick={() => setOpen(false)}
              key={href}
              href={href}
              aria-current={path === href ? 'page' : undefined}
            >
              {locale === 'en' ? labels[label] : label}
            </Link>
          ))}
        </nav>
        <Link className="button primary header-cta" href={signedIn ? '/account' : '/login'}>
          {locale === 'en'
            ? signedIn
              ? 'My campus'
              : 'Sign in'
            : signedIn
              ? 'مساحتي الجامعية'
              : 'تسجيل الدخول'}
        </Link>
      </div>
    </header>
  );
}
