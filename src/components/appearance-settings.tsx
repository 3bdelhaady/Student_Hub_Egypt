'use client';
import { useEffect, useState } from 'react';
export function AppearanceSettings({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const t = (ar: string, en: string) => (locale === 'en' ? en : ar);
  const [theme, setTheme] = useState('system'),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    setTheme(localStorage.getItem('hub-theme') || 'system');
  }, []);
  return (
    <section className="portal-form-section appearance-settings">
      <h2>{t('المظهر', 'Appearance')}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          localStorage.setItem('hub-theme', theme);
          document.documentElement.dataset.theme =
            theme === 'system'
              ? matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
              : theme;
          setSaved(true);
        }}
      >
        <fieldset className="appearance-options">
          <legend>{t('اختر المظهر المناسب لك', 'Choose your appearance')}</legend>
          {[
            ['light', t('الوضع الفاتح', 'Light')],
            ['dark', t('الوضع الداكن', 'Dark')],
            ['system', t('إعدادات الجهاز', 'Device settings')],
          ].map(([value, label]) => (
            <label key={value}>
              <span className={'theme-preview theme-' + value}>
                <i />
                <b />
                <b />
              </span>
              <span>
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={theme === value}
                  onChange={() => {
                    setTheme(value);
                    setSaved(false);
                  }}
                />
                {label}
              </span>
            </label>
          ))}
        </fieldset>
        <div className="actions">
          <button className="button primary">{t('حفظ التفضيلات', 'Save preferences')}</button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setTheme(localStorage.getItem('hub-theme') || 'system');
              setSaved(false);
            }}
          >
            {t('إلغاء التغييرات', 'Cancel changes')}
          </button>
        </div>
        {saved && (
          <p role="status" className="form-success">
            {t('تم حفظ المظهر على هذا الجهاز.', 'Appearance saved on this device.')}
          </p>
        )}
      </form>
    </section>
  );
}
export function ThemeBoot() {
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const stored = localStorage.getItem('hub-theme') || 'system';
      document.documentElement.dataset.theme =
        stored === 'system' ? (media.matches ? 'dark' : 'light') : stored;
    };
    apply();
    media.addEventListener('change', apply);
    window.addEventListener('storage', apply);
    window.addEventListener('hub-theme-change', apply);
    return () => {
      media.removeEventListener('change', apply);
      window.removeEventListener('storage', apply);
      window.removeEventListener('hub-theme-change', apply);
    };
  }, []);
  return null;
}
