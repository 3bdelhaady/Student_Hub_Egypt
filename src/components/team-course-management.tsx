import Link from 'next/link';
import { managedTeamCourses, managedTeamRoster } from '@/modules/portal/team-roster';
import type { PortalEntry } from '@/modules/portal/queries';
import type { viewer } from '@/lib/session';
export async function TeamCourseManagement({
  v,
  entries,
  courseId,
}: {
  v: NonNullable<Awaited<ReturnType<typeof viewer>>>;
  entries: PortalEntry[];
  courseId?: string;
}) {
  const allowed = await managedTeamCourses(v);
  const selected = allowed.find((r) => r.course.id === courseId);
  const roster = selected ? await managedTeamRoster(v, selected.course.id) : null;
  const teams = roster?.teams || [];
  return (
    <section className="form-stack">
      <h3>المقررات المفعّلة للفرق</h3>
      <div className="portal-kind-grid">
        {allowed.map(({ course: c }) => (
          <Link
            key={c.id}
            href={'/manage?kind=team&course=' + encodeURIComponent(c.id)}
            aria-current={selected?.course.id === c.id ? 'page' : undefined}
          >
            {c.title}
          </Link>
        ))}
      </div>
      {!allowed.length && <p>لم تُفعّل الفرق لأي مقرر بعد.</p>}
      {selected && (
        <article className="portal-form-section">
          <h3>{selected.course.title}</h3>
          <p>{selected.setting.conditions || 'لا يوجد وصف إضافي'}</p>
          <p>أقصى عدد أعضاء: {selected.setting.maxMembers}</p>
          <p>
            {selected.setting.approvalRequired
              ? 'إنشاء الفريق يحتاج موافقة المنسق'
              : 'إنشاء الفريق دون انتظار موافقة المنسق'}
          </p>
          <h4>الفرق في هذا المقرر</h4>
          <a
            className="button secondary"
            href={'/api/manage/team-roster?course=' + encodeURIComponent(selected.course.id)}
          >
            تحميل بيانات طلاب المقرر CSV
          </a>
          {teams.map((e) => (
            <section className="portal-form-section team-roster" key={e.id}>
              <Link href={'/manage?kind=team&edit=' + e.id}>
                {e.title} · {e.teamMarker}
              </Link>
              <p>{e.description}</p>
              <h4>أعضاء الفريق</h4>
              {roster?.members.some((m) => m.entryId === e.id) ? (
                <table>
                  <thead>
                    <tr>
                      <th>اسم الطالب</th>
                      <th>كود الطالب</th>
                      <th>الدور</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.members
                      .filter((m) => m.entryId === e.id)
                      .map((m) => (
                        <tr key={m.userId}>
                          <td>{m.name}</td>
                          <td>{m.studentCode || 'غير مسجل'}</td>
                          <td>{m.role === 'leader' ? 'قائد الفريق' : 'عضو'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p>لا يوجد أعضاء مسجلون في هذا الفريق بعد</p>
              )}
              <a
                className="button secondary"
                href={
                  '/api/manage/team-roster?course=' +
                  encodeURIComponent(selected.course.id) +
                  '&team=' +
                  encodeURIComponent(e.id)
                }
              >
                تحميل بيانات الفريق CSV
              </a>
              <p>
                {e.published ? 'متاح' : 'بانتظار الإتاحة'} · الأماكن المتبقية:{' '}
                {e.capacity ?? 'غير محدد'}
              </p>
            </section>
          ))}
          {!teams.length && <p>لا توجد فرق في هذا المقرر حتى الآن.</p>}
        </article>
      )}
    </section>
  );
}
