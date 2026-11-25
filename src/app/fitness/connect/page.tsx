'use client';

import { useSearchParams } from 'next/navigation';
import { studentLoginPath } from '@/modules/shared/return-path';
import { Suspense, useState } from 'react';

// The redirect target is NOT caller-supplied: it is fixed server-side from
// FITNESS_APP_ORIGIN (see /api/fitness/connect-target). Only the state token
// round-trips.
function ConnectInner() {
  const params = useSearchParams();
  const state = params.get('state') ?? '';
  const [phase, setPhase] = useState<'idle' | 'busy' | 'unauth' | 'error'>('idle');
  async function go() {
    setPhase('busy');
    try {
      const targetRes = await fetch('/api/fitness/connect-target');
      const { origin } = await targetRes.json().catch(() => ({ origin: '' }));
      if (!origin) {
        setPhase('error');
        return;
      }
      const res = await fetch('/api/fitness/grant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (res.status === 401) {
        setPhase('unauth');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.code) {
        setPhase('error');
        return;
      }
      window.location.href = `${origin}/api/auth/hub/callback?code=${encodeURIComponent(data.code)}&state=${encodeURIComponent(state)}`;
    } catch {
      setPhase('error');
    }
  }
  return (
    <section
      dir="rtl"
      style={{ maxWidth: 420, margin: '60px auto', padding: 16, textAlign: 'center' }}
    >
      <h1 style={{ color: '#16265c' }}>ربط حسابك بتطبيق Fitness Club</h1>
      <p style={{ color: '#4b5563' }}>
        سيتم مشاركة اسمك وبريدك ومعرّف حسابك في مركز الطلاب مع تطبيق نادي اللياقة البدنية لإنشاء ملفك
        هناك.
      </p>
      {phase === 'unauth' && (
        <p style={{ color: '#854d0e', background: '#fef9c3', borderRadius: 12, padding: 12 }}>
          سجّل دخولك في مركز الطلاب أولاً من{' '}
          <a
            href={studentLoginPath('/fitness/connect?state=' + encodeURIComponent(state))}
            style={{ color: '#16265c', fontWeight: 700 }}
          >
            صفحة الدخول
          </a>{' '}
          ستعود لهذه الصفحة بعد الدخول لتأكيد الربط.
        </p>
      )}
      {phase === 'error' && (
        <p style={{ color: '#b91c1c' }}>تعذر إنشاء رمز الربط، حاول مرة أخرى.</p>
      )}
      <button
        onClick={go}
        disabled={phase === 'busy' || !/^[A-Za-z0-9_-]{16,128}$/.test(state)}
        style={{
          background: '#16265c',
          color: '#fff',
          border: 0,
          borderRadius: 14,
          padding: '14px 24px',
          fontSize: 16,
          fontWeight: 700,
          width: '100%',
        }}
      >
        {phase === 'busy' ? 'جارٍ الربط...' : 'متابعة إلى Fitness Club'}
      </button>
    </section>
  );
}

export default function FitnessConnectPage() {
  return (
    <Suspense>
      <ConnectInner />
    </Suspense>
  );
}
