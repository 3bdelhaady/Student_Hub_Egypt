import { NextRequest, NextResponse } from 'next/server';
import { viewer } from '@/lib/session';
import { managedTeamRoster, teamRosterCsv } from '@/modules/portal/team-roster';
export async function GET(req: NextRequest) {
  const v = await viewer();
  if (!v) return new NextResponse('Unauthorized', { status: 401 });
  const course = req.nextUrl.searchParams.get('course') || '',
    team = req.nextUrl.searchParams.get('team') || undefined;
  if (!course || course.length > 100 || (team && team.length > 100))
    return new NextResponse('Not found', { status: 404 });
  const roster = await managedTeamRoster(v, course, team);
  if (!roster) return new NextResponse('Not found', { status: 404 });
  const csv = teamRosterCsv(
    roster.teams.flatMap((t) =>
      roster.members
        .filter((m) => m.entryId === t.id)
        .map((m) => ({ team: t.title, name: m.name, studentCode: m.studentCode })),
    ),
  );
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="team-students.csv"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
