import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
test('signup requires student gender, rejects assigned identity fields, and generates private fixed code server-side', async ({
  request,
}) => {
  const base = {
    name: 'Identity validation',
    email: `identity-${Date.now()}@example.test`,
    password: randomBytes(24).toString('base64url'),
  };
  const headers = { origin: 'http://localhost:3000' };
  for (const gender of [undefined, 'invalid']) {
    const r = await request.post('/api/auth/sign-up/email', {
      headers,
      data: { ...base, signupGender: gender },
    });
    expect(r.status()).toBe(400);
  }
  await new Promise((r) => setTimeout(r, 11000));
  const tamper = await request.post('/api/auth/sign-up/email', {
    headers,
    data: { ...base, signupGender: 'male', studentCode: 'ADMATK123' },
  });
  expect(tamper.status()).toBe(400);
  const r = await request.post('/api/auth/sign-up/email', {
    headers,
    data: { ...base, signupGender: 'male' },
  });
  expect(r.status()).toBe(200);
  const text = await r.text();
  expect(text).not.toContain('studentCode');
  expect(text).not.toContain('ADMATK123');
  expect(text).not.toContain('nationalIdFingerprint');
  const session = await request.get('/api/auth/get-session');
  expect(await session.text()).not.toContain('studentCode');
});
