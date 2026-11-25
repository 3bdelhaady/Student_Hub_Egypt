import { studentAreaViewer } from '@/lib/session';
import { academicTeamMembers } from '@/db/schema';
import { TeamLeaderPanel } from './team-leader-panel';
import { ReviewDemoNotice } from './review-demo-notice';
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import type { PortalEntry } from '@/modules/portal/queries';
import { requestStatuses } from '@/modules/portal/policy';
import { teamApplicationsOpen } from '@/modules/academic-teams/policy';
import { studentLoginPath } from '@/modules/shared/return-path';
import { RequestForm, SaveEntryButton } from './portal-forms';
import { money } from './portal-catalog';
export async function AcademicTeamDetail({
  entry: e,
  signedIn,
  saved,
  activeRequest,
}: {
  entry: PortalEntry;
  signedIn: boolean;
  saved: boolean;
  activeRequest?: { id: string; reference: string; status: string };
}) {
  const [course] = e.teamCourseId
    ? await db.select().from(courses).where(eq(courses.id, e.teamCourseId)).limit(1)
    : [];
  const v = await studentAreaViewer();
  const [member] = v
    ? await db
        .select()
        .from(academicTeamMembers)
        .where(
          and(eq(academicTeamMembers.entryId, e.id), eq(academicTeamMembers.userId, v.user.id)),
        )
        .limit(1)
    : [];
  const open = teamApplicationsOpen(e);
  return (
    <section className="academic-teams academic-team-detail">
      {e.demo && <ReviewDemoNotice />}
      <TeamLeaderPanel entryId={e.id} />
      <div className="breadcrumbs">
        <Link
          href={
            '/services?kind=team' +
            (e.teamCourseId ? '&course=' + encodeURIComponent(e.teamCourseId) : '')
          }
        >
          <ArrowRight size={15} />
          الفرق الأكاديمية
        </Link>
        <span>{e.title}</span>
      </div>
      <div className="academic-team-detail-grid">
        <article className="academic-team-panel">
          <span className="academic-team-marker">{e.teamMarker || <Users size={28} />}</span>
          <h1>{e.title}</h1>
          <p className="academic-team-info">
            {course ? 'المقرر المرتبط: ' + course.title : 'لم يُربط هذا الفريق بمقرر محدد.'}
          </p>
          {course?.instructor && <p className="form-hint">اسم دكتور المقرر: {course.instructor}</p>}
          <h2>عن الفريق</h2>
          <div className="prose">{e.description}</div>
          {e.category && <p>التصنيف: {e.category}</p>}
          {e.capacity !== null && <p>{e.capacity} مقعد متاح للتقديم</p>}
          {e.priceMinor > 0 && (
            <p>رسوم منشورة: {money(e.priceMinor)}، لا تُخصم أموال من نموذج الطلب.</p>
          )}
          {e.closesAt && (
            <p>
              آخر موعد للتقديم:{' '}
              {e.closesAt.toLocaleString('ar-EG', {
                timeZone: 'Africa/Cairo',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
          {signedIn && <SaveEntryButton id={e.id} saved={saved} />}
        </article>
        <aside className="academic-team-panel" id="team-apply">
          <h2>طلب الانضمام للفريق</h2>
          <p className="form-hint">
            يراجع قائد الفريق طلبك ويقرر قبوله أو رفضه. عند القبول تنضم إلى أعضاء الفريق داخل
            المنصة.
          </p>
          {member ? (
            <p>أنت {member.role === 'leader' ? 'قائد' : 'عضو في'} هذا الفريق.</p>
          ) : activeRequest ? (
            <>
              <p>لديك طلب {requestStatuses[activeRequest.status]}.</p>
              <p dir="ltr">{activeRequest.reference}</p>
              <Link className="button primary" href={'/requests/' + activeRequest.id}>
                متابعة طلبك الحالي
              </Link>
            </>
          ) : !open ? (
            <p className="academic-team-info">
              التقديم مغلق حاليًا، يمكنك متابعة الطلبات السابقة من صفحة طلباتي.
            </p>
          ) : signedIn ? (
            <RequestForm
              entry={{
                id: e.id,
                kind: e.kind,
                title: e.title,
                priceMinor: e.priceMinor,
                capacity: e.capacity,
              }}
            />
          ) : (
            <Link
              className="button primary"
              href={studentLoginPath('/services/' + e.id + '#team-apply')}
            >
              تسجيل الدخول لطلب الانضمام
            </Link>
          )}
          <Link className="text-link" href="/requests">
            كل طلباتي
          </Link>
        </aside>
      </div>
    </section>
  );
}
