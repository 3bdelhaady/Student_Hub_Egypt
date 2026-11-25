import { NextRequest, NextResponse } from 'next/server';
import { viewer } from '@/lib/session';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { db } from '@/db';
import { portalEntries, portalRequests, user, volunteerRequestChoices } from '@/db/schema';
import { and, eq, asc, inArray } from 'drizzle-orm';
import { canReadPortalEntry } from '@/modules/portal/queries';
import { rosterCsv } from '@/modules/portal/roster-csv';
export async function GET(req: NextRequest) {
  const v = await viewer();
  if (!v) return new NextResponse('Unauthorized', { status: 401 });
  if (!v.platformAdmin && !isAgentMode(v)) return new NextResponse('Not found', { status: 404 });
  const id = req.nextUrl.searchParams.get('entry') || '';
  const candidates = await db
    .select()
    .from(portalEntries)
    .where(and(eq(portalEntries.kind, 'volunteer'), id ? eq(portalEntries.id, id) : undefined));
  const allowed = [];
  for (const e of candidates) if (await canReadPortalEntry(v, e)) allowed.push(e.id);
  if (!allowed.length) return new NextResponse('Not found', { status: 404 });
  const rows = await db
    .select({
      name: user.name,
      code: user.studentCode,
      opportunity: portalEntries.title,
      division: volunteerRequestChoices.divisionLabel,
    })
    .from(portalRequests)
    .innerJoin(portalEntries, eq(portalEntries.id, portalRequests.entryId))
    .innerJoin(user, eq(user.id, portalRequests.userId))
    .leftJoin(volunteerRequestChoices, eq(volunteerRequestChoices.requestId, portalRequests.id))
    .where(
      and(
        eq(portalRequests.kind, 'volunteer'),
        eq(portalRequests.status, 'accepted'),
        inArray(portalEntries.id, allowed),
      ),
    )
    .orderBy(asc(portalEntries.title), asc(user.name));
  return new NextResponse(
    rosterCsv(
      ['الفرصة', 'القسم', 'اسم الطالب', 'كود الطالب'],
      rows.map((r) => [r.opportunity, r.division, r.name, r.code]),
    ),
    {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="accepted-volunteers.csv"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
