import { reportFailure } from '@/lib/diagnostics';
import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/db';
import { integrationTokens } from '@/db/schema';
import { eq, and, gt, isNull, sql } from 'drizzle-orm';
import { activationInput } from '@/lib/activation-input';
import { activateRoster } from '@/modules/membership/service';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (process.env.DEMO_MODE !== 'true')
    return NextResponse.json({ error: 'Demo integration only' }, { status: 503 });
  const header = request.headers.get('authorization') || '';
  if (!/^Bearer sh_[A-Za-z0-9_-]{43}$/.test(header))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const digest = createHash('sha256').update(header.slice(7)).digest('hex');
  const [key] = await db
    .select()
    .from(integrationTokens)
    .where(
      and(
        eq(integrationTokens.digest, digest),
        isNull(integrationTokens.revokedAt),
        gt(integrationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!key) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [limit] = await db
    .update(integrationTokens)
    .set({
      requestCount: sql`CASE WHEN ${integrationTokens.windowStartedAt} < now() - interval '60 seconds' THEN 1 ELSE ${integrationTokens.requestCount}+1 END`,
      windowStartedAt: sql`CASE WHEN ${integrationTokens.windowStartedAt} < now() - interval '60 seconds' THEN now() ELSE ${integrationTokens.windowStartedAt} END`,
    })
    .where(eq(integrationTokens.id, key.id))
    .returning({ count: integrationTokens.requestCount });
  if (limit.count > 10)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return NextResponse.json({ error: 'Use application/json' }, { status: 415 });
  try {
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: 'Missing body' }, { status: 400 });
    let total = 0;
    const parts: Uint8Array[] = [];
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > 32768) {
        await reader.cancel();
        return NextResponse.json({ error: 'Body too large' }, { status: 413 });
      }
      parts.push(chunk.value);
    }
    const raw = Buffer.concat(parts);
    const input = activationInput.safeParse(JSON.parse(raw.toString('utf8')));
    if (!input.success)
      return NextResponse.json(
        { error: 'Expected only emails: 1-100 valid email addresses' },
        { status: 400 },
      );
    const result = await activateRoster({
      emails: input.data.emails,
      universityId: key.universityId,
      actorId: null,
      integrationId: key.id,
    });
    return NextResponse.json(
      { ...result, demo: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    reportFailure('app.api.university.activate.route');
    return NextResponse.json({ error: 'Invalid input or unavailable service' }, { status: 400 });
  }
}
