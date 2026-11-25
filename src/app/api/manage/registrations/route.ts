import { NextRequest, NextResponse } from 'next/server';
import { viewer } from '@/lib/session';
import { db } from '@/db';
import {
  portalEntries,
  portalRequests,
  user,
  studentProfiles,
  memberships,
  faculties,
  universities,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { canReadPortalEntry } from '@/modules/portal/queries';
export async function GET(req: NextRequest) {
  const v = await viewer();
  if (!v) return new NextResponse('Unauthorized', { status: 401 });
  const id = req.nextUrl.searchParams.get('entry') || '';
  const [entry] = await db.select().from(portalEntries).where(eq(portalEntries.id, id)).limit(1);
  if (!entry || entry.kind !== 'ticket' || !(await canReadPortalEntry(v, entry)))
    return new NextResponse('Not found', { status: 404 });
  const rows = await db
    .select({
      reference: portalRequests.reference,
      name: user.name,
      email: user.email,
      phone: studentProfiles.phone,
      university: universities.name,
      faculty: faculties.name,
      status: portalRequests.status,
      quantity: portalRequests.quantity,
    })
    .from(portalRequests)
    .innerJoin(user, eq(user.id, portalRequests.userId))
    .leftJoin(studentProfiles, eq(studentProfiles.userId, user.id))
    .leftJoin(memberships, eq(memberships.userId, user.id))
    .leftJoin(universities, eq(universities.id, memberships.universityId))
    .leftJoin(faculties, eq(faculties.id, memberships.facultyId))
    .where(and(eq(portalRequests.entryId, id), eq(portalRequests.kind, 'ticket')))
    .limit(10000);
  const cell = (value: unknown) =>
    '"' +
    String(value ?? '')
      .replace(/^(?:\s*[=+@-]|[\t\r])/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const csv =
    '\uFEFF' +
    [
      ['المرجع', 'الاسم', 'البريد', 'الهاتف', 'الجامعة', 'الكلية', 'الحالة', 'العدد'],
      ...rows.map((r) => Object.values(r)),
    ]
      .map((r) => r.map(cell).join(','))
      .join('\r\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ticket-registrations.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}
