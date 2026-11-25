import { NextRequest, NextResponse } from 'next/server';
import { viewer } from '@/lib/session';
import { isAgentMode } from '@/modules/identity/mode-policy';
import { db } from '@/db';
import { portalEntries, portalRequests, user } from '@/db/schema';
import { and, eq, asc } from 'drizzle-orm';
import { canReadPortalEntry } from '@/modules/portal/queries';
import { rosterCsv } from '@/modules/portal/roster-csv';
import { requestStatuses } from '@/modules/portal/policy';
export async function GET(req: NextRequest) {
  const v = await viewer();
  if (!v) return new NextResponse('Unauthorized', { status: 401 });
  if (!v.platformAdmin && !isAgentMode(v)) return new NextResponse('Not found', { status: 404 });
  const id = req.nextUrl.searchParams.get('entry') || '';
  const [entry] = await db
    .select()
    .from(portalEntries)
    .where(and(eq(portalEntries.id, id), eq(portalEntries.kind, 'service')))
    .limit(1);
  if (
    !entry ||
    !(await canReadPortalEntry(v, entry)) ||
    (!v.platformAdmin && entry.authorId !== v.user.id)
  )
    return new NextResponse('Not found', { status: 404 });
  const rows = await db
    .select({ name: user.name, code: user.studentCode, status: portalRequests.status })
    .from(portalRequests)
    .innerJoin(user, eq(user.id, portalRequests.userId))
    .where(and(eq(portalRequests.entryId, id), eq(portalRequests.kind, 'service')))
    .orderBy(asc(user.name));
  return new NextResponse(
    rosterCsv(
      ['اسم الطالب', 'كود الطالب', 'الحالة'],
      rows.map((r) => [r.name, r.code, requestStatuses[r.status] || r.status]),
    ),
    {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="opportunity-applicants.csv"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
