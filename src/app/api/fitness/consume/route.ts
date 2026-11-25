import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { fitnessSecret, verifyFitnessCode } from '@/modules/identity/fitness-link';
export async function POST(req: NextRequest) {
  const secret = fitnessSecret();
  if (!secret) return NextResponse.json({ error: 'fitness link not configured' }, { status: 503 });
  if (Number(req.headers.get('content-length')) > 6000)
    return NextResponse.json({ error: 'invalid code' }, { status: 400 });
  const body = await req.json().catch(() => null),
    data = verifyFitnessCode(body?.code, secret);
  if (!data) return NextResponse.json({ error: 'invalid code' }, { status: 400 });
  const consumed = await db.execute(
    sql`UPDATE fitness_link_nonces SET consumed_at=now() WHERE nonce=${data.nonce} AND user_id=${data.hub_user_id} AND consumed_at IS NULL AND created_at > now()-interval '5 minutes' RETURNING nonce`,
  );
  if (!consumed.rows.length)
    return NextResponse.json({ error: 'invalid or used code' }, { status: 400 });
  return NextResponse.json(
    { hub_user_id: data.hub_user_id, name: data.name, email: data.email, state: data.state },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
