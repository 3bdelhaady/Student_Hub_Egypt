import { notFound } from 'next/navigation';
import { managedTeamRoster } from '@/modules/portal/team-roster';
import { type PortalEntry } from '@/modules/portal/queries';
import { type viewer } from '@/lib/session';
import { TeamDescriptionForm } from './team-description-form';
export async function TeamManagementDetail({
  v,
  entry,
}: {
  v: NonNullable<Awaited<ReturnType<typeof viewer>>>;
  entry: PortalEntry;
}) {
  const roster = await managedTeamRoster(v, entry.teamCourseId || '', entry.id);
  if (!roster) notFound();
  return (
    <article className="portal-form-section">
      <h2>{entry.title}</h2>
      <TeamDescriptionForm id={entry.id} description={entry.description} />
      <h3>الأعضاء المسجلون</h3>
      {roster.members.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>كود الطالب</th>
              </tr>
            </thead>
            <tbody>
              {roster.members.map((m) => (
                <tr key={m.userId}>
                  <td>{m.name}</td>
                  <td>{m.studentCode || 'غير مسجل'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>لا يوجد أعضاء مسجلون في هذا الفريق بعد</p>
      )}
      <a
        className="button secondary"
        href={
          '/api/manage/team-roster?course=' +
          encodeURIComponent(entry.teamCourseId!) +
          '&team=' +
          encodeURIComponent(entry.id)
        }
      >
        تحميل بيانات الفريق CSV
      </a>
    </article>
  );
}
