import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
export const fitnessState = z.string().regex(/^[A-Za-z0-9_-]{16,128}$/);
export const fitnessGrant = z
  .object({
    iss: z.literal('student-hub-egypt'),
    aud: z.literal('fitness-club'),
    nonce: z.uuid(),
    state: fitnessState,
    hub_user_id: z.string().min(1).max(200),
    name: z.string().min(1).max(200),
    email: z.email().max(320),
    exp: z.number().int().positive(),
  })
  .strict();
export function fitnessOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (
      u.protocol !== 'https:' ||
      u.username ||
      u.password ||
      u.pathname !== '/' ||
      u.search ||
      u.hash ||
      u.origin !== value.replace(/\/$/, '')
    )
      return null;
    return u.origin;
  } catch {
    return null;
  }
}
export function fitnessSecret() {
  const value = process.env.FITNESS_LINK_SECRET;
  return value && value.length >= 32 ? value : null;
}
export function verifyFitnessCode(code: unknown, secret: string, now = Date.now()) {
  if (typeof code !== 'string' || code.length > 5000) return null;
  const parts = code.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]+$/.test(signature)) return null;
  const expected = Buffer.from(createHmac('sha256', secret).update(payload).digest('base64url')),
    sig = Buffer.from(signature);
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  try {
    const result = fitnessGrant.safeParse(
      JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')),
    );
    if (!result.success || result.data.exp * 1000 <= now || result.data.exp * 1000 > now + 301000)
      return null;
    return result.data;
  } catch {
    return null;
  }
}
