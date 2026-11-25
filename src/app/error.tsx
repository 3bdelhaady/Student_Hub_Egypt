'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="section container">
      <div className="empty">
        <h1>حصلت مشكلة مؤقتة.</h1>
        <p>لم نتمكن من تحميل هذه الصفحة، جرّب مرة أخرى.</p>
        <button className="button primary" onClick={reset}>
          إعادة المحاولة
        </button>
      </div>
    </section>
  );
}
