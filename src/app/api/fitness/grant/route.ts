import { needsEmailVerification } from '@/modules/identity/email-security';
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomUUID } from 'node:crypto';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { fitnessSecret, fitnessOrigin, fitnessState } from '@/modules/identity/fitness-link';
export async function POST(req: NextRequest) {
  const secret = fitnessSecret(),
    target = fitnessOrigin(process.env.FITNESS_APP_ORIGIN);
  if (!secret || !target)
    return NextResponse.json({ error: 'fitness link not configured' }, { status: 503 });
  if (
    req.headers.get('origin') !== new URL(req.url).origin ||
    req.headers.get('sec-fetch-site') === 'cross-site'
  )
    return NextResponse.json({ error: 'invalid origin' }, { status: 403 });
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user || needsEmailVerification(session.user))
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (Number(req.headers.get('content-length')) > 1000)
    return NextResponse.json({ error: 'invalid state' }, { status: 400 });
  const body = await req.json().catch(() => null),
    state = fitnessState.safeParse(body?.state);
  if (!state.success) return NextResponse.json({ error: 'invalid state' }, { status: 400 });
  const nonce = randomUUID();
  // Serialize grants for one identity and bound the short-lived pending set.
  const allowed = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM "user" WHERE id=${session.user.id} FOR UPDATE`);
    const count = await tx.execute(
      sql`SELECT count(*)::int AS n FROM fitness_link_nonces WHERE user_id=${session.user.id} AND created_at > now()-interval '5 minutes'`,
    );
    if (Number(count.rows[0]?.n) >= 10) return false;
    await tx.execute(
      sql`DELETE FROM fitness_link_nonces WHERE user_id=${session.user.id} AND created_at < now()-interval '1 day'`,
    );
    await tx.execute(
      sql`INSERT INTO fitness_link_nonces(nonce,user_id) VALUES(${nonce},${session.user.id})`,
    );
    return true;
  });
  if (!allowed) return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  const payload = Buffer.from(
    JSON.stringify({
      iss: 'student-hub-egypt',
      aud: 'fitness-club',
      nonce,
      state: state.data,
      hub_user_id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      exp: Math.floor(Date.now() / 1000) + 300,
    }),
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return NextResponse.json(
    { code: payload + '.' + sig },
    { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } },
  );
}
