import { ReviewDemoNotice } from './review-demo-notice';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { db } from '@/db';
import { pollOptions, pollVotes, portalSaved } from '@/db/schema';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { studentAreaViewer } from '@/lib/session';
import { visiblePortalEntries } from '@/modules/portal/queries';
import { pollPhase, pollResults } from '@/modules/portal/polls';
import { PollBallot } from './poll-ballot';
import { SaveEntryButton } from './portal-forms';
export async function StudentVoice({
  params,
}: {
  params: { q?: string; category?: string; saved?: string; poll?: string };
}) {
  const v = await studentAreaViewer();
  const all = (await visiblePortalEntries()).filter((entry) => entry.kind === 'poll');
  const saved = v
    ? await db
        .select({ entryId: portalSaved.entryId })
        .from(portalSaved)
        .where(eq(portalSaved.userId, v.user.id))
    : [];
  const savedIds = new Set(saved.map((row) => row.entryId));
  const entries = all.filter(
    (entry) =>
      (!params.q || (entry.title + ' ' + entry.description).includes(params.q)) &&
      (!params.category || entry.category === params.category) &&
      (!params.saved || savedIds.has(entry.id)),
  );
  const ids = entries.map((entry) => entry.id);
  const options = ids.length
    ? await db
        .select()
        .from(pollOptions)
        .where(inArray(pollOptions.entryId, ids))
        .orderBy(asc(pollOptions.label), asc(pollOptions.id))
    : [];
  const counts = ids.length
    ? await db
        .select({
          entryId: pollVotes.entryId,
          optionId: pollVotes.optionId,
          total: sql<number>`count(*)::int`,
        })
        .from(pollVotes)
        .where(inArray(pollVotes.entryId, ids))
        .groupBy(pollVotes.entryId, pollVotes.optionId)
    : [];
  const mine =
    v && ids.length
      ? await db
          .select({ entryId: pollVotes.entryId, optionId: pollVotes.optionId })
          .from(pollVotes)
          .where(and(eq(pollVotes.userId, v.user.id), inArray(pollVotes.entryId, ids)))
      : [];
  const active = entries.filter((entry) => pollPhase(entry) !== 'closed');
  const closed = entries.filter((entry) => pollPhase(entry) === 'closed');
  const selected =
    entries.find((entry) => entry.id === params.poll) ||
    active.find((entry) => pollPhase(entry) === 'open') ||
    active[0] ||
    closed[0];
  const selectedIndex = selected ? entries.findIndex((entry) => entry.id === selected.id) : -1;
  function destination(id?: string, savedOnly = !!params.saved) {
    const query = new URLSearchParams({ kind: 'poll' });
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (savedOnly) query.set('saved', '1');
    if (id) query.set('poll', id);
    return '/services?' + query;
  }
  return (
    <section className="student-voice">
      {all.some((e) => e.demo) && <ReviewDemoNotice />}
      <header className="student-voice-heading">
        <h1>صوت الطلاب</h1>
        <p>شارك رأيك في الاستبيانات المتاحة لمجتمعك، وراجع نتائج التصويت الفعلية.</p>
      </header>
      <details
        className="student-voice-filter-disclosure"
        open={!!(params.q || params.category || params.saved)}
      >
        <summary>بحث وتصفية الاستبيانات</summary>
        <form action="/services" className="student-voice-filters">
          <input type="hidden" name="kind" value="poll" />
          {params.saved && <input type="hidden" name="saved" value="1" />}
          <label className="student-voice-search">
            <span>
              <Search size={17} /> بحث في الاستبيانات
            </span>
            <input name="q" defaultValue={params.q || ''} maxLength={120} />
          </label>
          <label>
            التصنيف
            <select name="category" defaultValue={params.category || ''}>
              <option value="">كل التصنيفات</option>
              {[...new Set(all.map((entry) => entry.category).filter(Boolean))]
                .sort()
                .map((category) => (
                  <option key={category}>{category}</option>
                ))}
            </select>
          </label>
          <button className="button secondary">تطبيق</button>
          <Link className="text-link" href={destination(undefined, !params.saved)}>
            {params.saved ? 'عرض الكل' : 'المحفوظات'}
          </Link>
        </form>
      </details>
      {selected ? (
        <>
          <nav className="student-voice-navigation" aria-label="اختيار الاستبيان">
            {selectedIndex > 0 ? (
              <Link className="button secondary" href={destination(entries[selectedIndex - 1].id)}>
                <ArrowRight size={16} />
                السابق
              </Link>
            ) : (
              <span />
            )}
            <details className="student-voice-picker">
              <summary>
                الاستبيان {selectedIndex + 1} من {entries.length}
              </summary>
              <form action="/services">
                <input type="hidden" name="kind" value="poll" />
                {params.q && <input type="hidden" name="q" value={params.q} />}{' '}
                {params.category && <input type="hidden" name="category" value={params.category} />}{' '}
                {params.saved && <input type="hidden" name="saved" value="1" />}
                <label>
                  الاستبيان {selectedIndex + 1} من {entries.length}
                  <select name="poll" defaultValue={selected.id}>
                    {entries.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button secondary">عرض</button>
              </form>
            </details>
            {selectedIndex < entries.length - 1 ? (
              <Link className="button secondary" href={destination(entries[selectedIndex + 1].id)}>
                التالي
                <ArrowLeft size={16} />
              </Link>
            ) : (
              <span />
            )}
          </nav>
          <PollBallot
            entry={selected}
            options={options.filter((option) => option.entryId === selected.id)}
            counts={counts.filter((count) => count.entryId === selected.id)}
            mine={mine.find((vote) => vote.entryId === selected.id)?.optionId}
            signedIn={!!v}
            eligible={v?.membership?.status === 'active'}
            returnPath={destination(selected.id)}
          />
          <div className="student-voice-tools">
            {v && <SaveEntryButton id={selected.id} saved={savedIds.has(selected.id)} />}
            <Link className="text-link" href={'/services/' + selected.id}>
              فتح صفحة الاستبيان
            </Link>
          </div>
        </>
      ) : (
        <div className="student-voice-ballot">
          <h2>لا توجد استبيانات مطابقة</h2>
          <p>
            {params.saved
              ? 'لا تظهر عناصر محفوظة ومتاحة ضمن هذه الفلاتر.'
              : 'تظهر هنا الاستبيانات المنشورة والمتاحة لنطاق عضويتك فقط.'}
          </p>
          <Link href="/services?kind=poll" className="text-link">
            مسح الفلاتر
          </Link>
        </div>
      )}
      <section className="student-voice-history">
        <h2>نتائج التصويتات المغلقة</h2>
        <p>الأعداد والنسب من الأصوات المسجلة، وليست قرارات معتمدة أو نسب مشاركة رسمية.</p>
        {closed.length ? (
          <div className="student-voice-history-grid">
            {closed.map((entry) => {
              const result = pollResults(
                options.filter((option) => option.entryId === entry.id),
                counts.filter((count) => count.entryId === entry.id),
              );
              const top = Math.max(0, ...result.rows.map((row) => row.votes));
              const leaders = result.rows.filter((row) => row.votes === top && top > 0);
              return (
                <article key={entry.id}>
                  <span className="tag">{entry.category || 'تصويت مغلق'}</span>
                  <h3>
                    <Link href={destination(entry.id)}>{entry.title}</Link>
                  </h3>
                  {leaders.length === 1 ? (
                    <>
                      <p>{leaders[0].label}</p>
                      <progress
                        aria-label={'حصة الخيار الأعلى في ' + entry.title}
                        value={top}
                        max={result.total || 1}
                      />
                      <strong>{leaders[0].percentage}%</strong>
                    </>
                  ) : (
                    <p>
                      {leaders.length > 1 ? 'تعادل بين الخيارات الأعلى' : 'لا توجد أصوات مسجلة'}
                    </p>
                  )}
                  <p>{result.total} صوت مسجل</p>
                  <Link className="text-link" href={destination(entry.id)}>
                    كل النتائج
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="notice">لا توجد تصويتات مغلقة متاحة ضمن هذه الفلاتر.</p>
        )}
      </section>
    </section>
  );
}
