'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
export function FooterThemeSwitch() {
  const [theme, setTheme] = useState('system');
  useEffect(() => {
    const read = () => setTheme(localStorage.getItem('hub-theme') || 'system');
    read();
    window.addEventListener('storage', read);
    window.addEventListener('hub-theme-change', read);
    return () => {
      window.removeEventListener('storage', read);
      window.removeEventListener('hub-theme-change', read);
    };
  }, []);
  return (
    <div className="footer-theme-switch" role="group" aria-label="مظهر المنصة">
      {[
        { value: 'light', label: 'الوضع الفاتح', icon: Sun },
        { value: 'dark', label: 'الوضع الداكن', icon: Moon },
        { value: 'system', label: 'إعدادات الجهاز', icon: Monitor },
      ].map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          title={label}
          aria-pressed={theme === value}
          onClick={() => {
            localStorage.setItem('hub-theme', value);
            setTheme(value);
            window.dispatchEvent(new Event('hub-theme-change'));
          }}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
