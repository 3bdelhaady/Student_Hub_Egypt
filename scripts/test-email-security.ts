// Disposable integration test only. Never point this at a hosted database.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
if (process.env.DATABASE_URL || !process.cwd().includes('hub-email-test-'))
  throw Error('Disposable directory required');
let stage = 'imports';
async function main() {
  const sent: { to: string[]; text: string }[] = [];
  globalThis.fetch = async (_input, init) => {
    sent.push(JSON.parse(String(init?.body)));
    return new Response('{}', { status: 200 });
  };
  const { auth } = await import('../src/lib/auth');
  const { db } = await import('../src/db');
  const s = await import('../src/db/schema');
  const { eq } = await import('drizzle-orm');
  const password = randomBytes(24).toString('base64url'),
    replacement = randomBytes(24).toString('base64url');
  const email = 'security@example.test';
  stage = 'signup';
  const created = await auth.api.signUpEmail({
    body: { name: 'Disposable', email, password, signupGender: 'male' } as never,
  });
  assert.equal(sent.length, 1);
  assert.equal(created.user.emailVerified, false);
  assert.equal(created.token, null);
  await auth.api.sendVerificationEmail({ body: { email, callbackURL: '/registration' } });
  assert.equal(sent.length, 2);
  stage = 'reject unverified';
  await assert.rejects(auth.api.signInEmail({ body: { email, password } }));
  const verification = new URL(sent[0].text.split('\n').find((v) => v.startsWith('http'))!);
  stage = 'verify';
  await auth.api.verifyEmail({ query: { token: verification.searchParams.get('token')! } });
  stage = 'verified login';
  const login = await auth.api.signInEmail({ body: { email, password } });
  assert.ok(login.token);
  stage = 'request reset';
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: 'http://localhost:3000/reset-password' },
  });
  const reset = new URL(
    sent
      .at(-1)!
      .text.split('\n')
      .find((v) => v.startsWith('http'))!,
  );
  const token = reset.pathname.split('/').at(-1)!;
  stage = 'reset';
  await auth.api.resetPassword({ body: { token, newPassword: replacement } });
  await assert.rejects(auth.api.resetPassword({ body: { token, newPassword: password } }));
  await assert.rejects(auth.api.signInEmail({ body: { email, password } }));
  await auth.api.signInEmail({ body: { email, password: replacement } });
  const sessions = await db.select().from(s.session).where(eq(s.session.token, login.token!));
  assert.equal(sessions.length, 0);
  stage = 'unknown';
  await auth.api.requestPasswordReset({ body: { email } });
  await db.update(s.verification).set({ expiresAt: new Date('2000-01-01') });
  const expired = new URL(
    sent
      .at(-1)!
      .text.split('\n')
      .find((v) => v.startsWith('http'))!,
  ).pathname
    .split('/')
    .at(-1)!;
  await assert.rejects(auth.api.resetPassword({ body: { token: expired, newPassword: password } }));
  const unknown = await auth.api.requestPasswordReset({ body: { email: 'absent@example.test' } });
  assert.equal(unknown.status, true);
  await db
    .update(s.user)
    .set({ createdAt: new Date('2000-01-01'), emailVerified: false })
    .where(eq(s.user.id, created.user.id));
  await auth.api.signInEmail({ body: { email, password: replacement } });
  console.log(
    'Verified signup, verification, blocked login, recovery, single use, session revocation and legacy access.',
  );
  process.exit(0);
}
main().catch(() => {
  console.error('Email security integration assertion failed at ' + stage);
  process.exit(1);
});
