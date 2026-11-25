import { db } from '@/db';
import { portalEntries, portalEntryImages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { viewer } from '@/lib/session';
import { activeStudentEntryScope, canReadPortalEntry } from '@/modules/portal/queries';
import { canStudentReadEntry } from '@/modules/portal/policy';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db
    .select({ media: portalEntryImages, entry: portalEntries })
    .from(portalEntryImages)
    .innerJoin(portalEntries, eq(portalEntries.id, portalEntryImages.entryId))
    .where(eq(portalEntryImages.id, id))
    .limit(1);
  if (!row) return new Response(null, { status: 404 });
  const v = await viewer();
  if (
    !(v && (await canReadPortalEntry(v, row.entry))) &&
    !canStudentReadEntry(
      v?.membership,
      row.entry,
      await activeStudentEntryScope(row.entry, v?.membership),
    )
  )
    return new Response(null, { status: 404 });
  return new Response(Buffer.from(row.media.data, 'base64'), {
    headers: {
      'Content-Type': row.media.mimeType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
