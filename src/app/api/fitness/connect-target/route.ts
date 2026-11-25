import { NextResponse } from 'next/server';
import { fitnessOrigin, fitnessSecret } from '@/modules/identity/fitness-link';
export async function GET() {
  const origin = fitnessOrigin(process.env.FITNESS_APP_ORIGIN);
  if (!origin || !fitnessSecret())
    return NextResponse.json({ error: 'not configured' }, { status: 503 });
  return NextResponse.json({ origin }, { headers: { 'Cache-Control': 'no-store' } });
}
