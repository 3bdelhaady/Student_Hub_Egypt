import Link from 'next/link';
import { CheckCircle2, Clock3, Vote } from 'lucide-react';
import { VoteForm } from './portal-forms';
import { pollPhase, pollResults, type PollTiming } from '@/modules/portal/polls';
import { studentLoginPath } from '@/modules/shared/return-path';
export function PollBallot({
  entry,
  options,
  counts,
  mine,
  signedIn,
  eligible,
  returnPath,
}: {
  entry: PollTiming & { id: string; title: string; description: string; category: string };
  options: { id: string; label: string }[];
  counts: { optionId: string; total: number }[];
  mine?: string;
  signedIn: boolean;
  eligible: boolean;
  returnPath: string;
}) {
  const phase = pollPhase(entry);
  const results = pollResults(options, counts);
  const showResults = !!mine || phase === 'closed';
  return (
    <article className="student-voice-ballot" data-poll-id={entry.id}>
      <div className="student-voice-meta">
        <span className="tag">
          <Vote size={14} />
          {phase === 'closed' ? 'انتهى التصويت' : phase === 'upcoming' ? 'قريبًا' : 'التصويت متاح'}
        </span>
        {entry.closesAt && (
          <span>
            <Clock3 size={14} /> {phase === 'closed' ? 'موعد الإغلاق:' : 'يغلق'}{' '}
            {entry.closesAt.toLocaleString('ar-EG', {
              timeZone: 'Africa/Cairo',
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        )}
      </div>
      <h2>{entry.title}</h2>
      {entry.category && <p className="student-voice-category">{entry.category}</p>}
      <details className="student-voice-description">
        <summary>تفاصيل الاستبيان</summary>
        <p className="prose">{entry.description}</p>
      </details>
      {showResults ? (
        <div className="student-voice-results">
          <p className="student-voice-status">
            <CheckCircle2 size={18} />
            {mine ? 'تم تسجيل صوتك' : 'نتائج التصويت المغلق'}
          </p>
          {results.rows.map((row) => (
            <div className="poll-result" key={row.id}>
              <span>
                {row.label}
                {mine === row.id && <small> · اختيارك</small>}
              </span>
              <strong>{row.percentage}%</strong>
              <progress
                aria-label={'نتيجة ' + row.label}
                max={results.total || 1}
                value={row.votes}
              />
              <small>{row.votes} صوت</small>
            </div>
          ))}
        </div>
      ) : phase === 'upcoming' ? (
        <p className="notice">
          يبدأ التصويت{' '}
          {entry.startsAt?.toLocaleString('ar-EG', {
            timeZone: 'Africa/Cairo',
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
          .
        </p>
      ) : options.length < 2 ? (
        <p className="notice">خيارات هذا الاستبيان غير مكتملة، التصويت غير متاح الآن.</p>
      ) : !signedIn ? (
        <Link className="button primary" href={studentLoginPath(returnPath)}>
          سجل الدخول للتصويت
        </Link>
      ) : !eligible ? (
        <div className="notice">
          <p>التصويت يحتاج عضوية جامعية مفعّلة.</p>
          <Link className="text-link" href="/account?view=student">
            متابعة العضوية
          </Link>
        </div>
      ) : (
        <VoteForm id={entry.id} options={options} />
      )}
      <p className="student-voice-count">{results.total} صوت مسجل</p>
      <p className="form-hint student-voice-privacy">
        صوت واحد لكل حساب، يُحفظ اختيارك مرتبطًا بحسابك لمنع التكرار، وتظهر النتائج هنا مجمّعة، ليست
        هذه النتيجة إعلان قرار رسمي.
      </p>
    </article>
  );
}
