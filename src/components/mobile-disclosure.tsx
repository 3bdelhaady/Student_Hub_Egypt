'use client';
import { useEffect, useState, type ReactNode } from 'react';
export function MobileDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width:760px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return (
    <details
      className="mobile-disclosure"
      open={!mobile || expanded}
      onToggle={(e) => {
        if (mobile) setExpanded(e.currentTarget.open);
      }}
    >
      <summary>
        {title}
        <span aria-hidden="true">＋</span>
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
