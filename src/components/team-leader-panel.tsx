import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { academicTeamMembers, portalRequests, user } from '@/db/schema';
import { studentAreaViewer } from '@/lib/session';
import { ActionForm } from './portal-forms';
import { decideTeamJoin } from '@/modules/academic-teams/member-actions';
export async function TeamLeaderPanel({ entryId }: { entryId: string }) {
  const v = await studentAreaViewer();
  if (!v) return null;
  const members = await db
    .select({ member: academicTeamMembers, name: user.name })
    .from(academicTeamMembers)
    .innerJoin(user, eq(user.id, academicTeamMembers.userId))
    .where(eq(academicTeamMembers.entryId, entryId));
  const own = members.find((m) => m.member.userId === v.user.id);
  if (!own) return null;
  const requests =
    own.member.role === 'leader'
      ? await db
          .select({ request: portalRequests, name: user.name })
          .from(portalRequests)
          .innerJoin(user, eq(user.id, portalRequests.userId))
          .where(
            and(
              eq(portalRequests.entryId, entryId),
              eq(portalRequests.kind, 'team'),
              inArray(portalRequests.status, ['pending', 'reviewing']),
            ),
          )
      : [];
  return (
    <section className="portal-form-section">
      <h2>{own.member.role === 'leader' ? 'إدارة فريقي' : 'عضويتي في الفريق'}</h2>
      <p>{own.member.role === 'leader' ? 'أنت منشئ وقائد هذا الفريق' : 'أنت عضو في هذا الفريق'}</p>
      <h3>أعضاء الفريق</h3>
      {members.map((m) => (
        <p key={m.member.userId}>
          {m.name}
          {m.member.role === 'leader' ? ' · قائد الفريق' : ''}
        </p>
      ))}
      {own.member.role === 'leader' && (
        <>
          <h3>طلبات الانضمام الجديدة</h3>
          {requests.map(({ request: r, name }) => (
            <article key={r.id}>
              <h4>{name}</h4>
              <p>{r.body}</p>
              <ActionForm action={decideTeamJoin} label="تأكيد القرار">
                <input type="hidden" name="requestId" value={r.id} />
                <label>
                  قرار الانضمام
                  <select name="outcome">
                    <option value="accepted">قبول الانضمام</option>
                    <option value="declined">رفض الانضمام</option>
                  </select>
                </label>
              </ActionForm>
            </article>
          ))}
          {!requests.length && <p>لا توجد طلبات انضمام جديدة.</p>}
        </>
      )}
    </section>
  );
}
