'use client';
import { AdminAccountToggle } from './admin-account-toggle';
import { InstitutionLifecycle } from './institution-lifecycle';
import { useState, useEffect } from 'react';
import { searchAdminDirectory } from '@/modules/institution/directory-search';
import Link from 'next/link';
import { Search, SlidersHorizontal, MoreVertical } from 'lucide-react';
export type DirectoryRow = {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  status: string;
  cells: string[];
  href?: string;
  accountToggle?: { id: string; kind: 'student' | 'agent'; active: boolean };
  institutionState?: { active: boolean };
};
export function ConsoleDirectory({
  rows,
  columns,
  placeholder,
  categoryLabel = 'التصنيف',
  searchKind,
}: {
  rows: DirectoryRow[];
  columns: string[];
  placeholder: string;
  categoryLabel?: string;
  searchKind?: string;
}) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [remote, setRemote] = useState<DirectoryRow[] | null>(null);
  useEffect(() => {
    let valid = true;
    setRemote(null);
    if (!searchKind || !q.trim()) return;
    const timer = setTimeout(() => {
      searchAdminDirectory(searchKind, q)
        .then((r) => {
          if (valid) setRemote(r);
        })
        .catch(() => {});
    }, 250);
    return () => {
      valid = false;
      clearTimeout(timer);
    };
  }, [q, searchKind, rows]);
  const source = remote || rows;
  const filtered = source.filter(
    (r) =>
      (!category || r.category === category) &&
      (!status || r.status === status) &&
      [r.title, r.subtitle, ...r.cells]
        .join(' ')
        .toLocaleLowerCase('ar')
        .includes(q.toLocaleLowerCase('ar')),
  );
  return (
    <>
      <div className="console-filterbar">
        <SlidersHorizontal size={17} />
        <select
          aria-label={categoryLabel}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{categoryLabel}</option>
          {[...new Set(source.map((r) => r.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select aria-label="الحالة" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">الحالة</option>
          {[...new Set(source.map((r) => r.status))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="console-search">
          <Search size={17} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
          />
        </label>
      </div>
      <div className="table-wrap console-directory" tabIndex={0} aria-label="قائمة الإدارة">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td data-label={columns[0]}>
                  <span className="console-identity">
                    <span className="console-avatar">{r.title.slice(0, 1)}</span>
                    <span>
                      {r.title}
                      <small>{r.subtitle}</small>
                    </span>
                  </span>
                </td>
                {r.cells.map((c, i) => (
                  <td key={i} data-label={columns[i + 1]}>
                    <span className={i === r.cells.length - 1 ? 'console-status' : ''}>{c}</span>
                    {r.institutionState && i === r.cells.length - 1 && (
                      <InstitutionLifecycle
                        id={r.id}
                        name={r.title}
                        active={r.institutionState.active}
                        toggleOnly
                      />
                    )}
                  </td>
                ))}
                <td data-label="إجراء">
                  {r.accountToggle && <AdminAccountToggle {...r.accountToggle} />}
                  {r.href ? (
                    <Link
                      className="console-row-action"
                      href={r.href}
                      aria-label={`إدارة ${r.title}`}
                    >
                      {!r.accountToggle && !r.institutionState && <MoreVertical size={17} />}
                      <span>{r.accountToggle ? 'الصلاحيات' : 'التفاصيل'}</span>
                    </Link>
                  ) : (
                    !r.accountToggle && <span>للعرض فقط</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="console-empty">لا توجد نتائج مطابقة، جرّب تغيير البحث أو الفلاتر.</div>
        )}
      </div>
      <p className="console-result-count" aria-live="polite">
        عرض {filtered.length} من {source.length} سجل في القائمة الحالية
      </p>
    </>
  );
}
