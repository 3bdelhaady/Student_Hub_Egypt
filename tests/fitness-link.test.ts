import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID, randomBytes } from 'node:crypto';
import { fitnessOrigin, verifyFitnessCode } from '../src/modules/identity/fitness-link';
test('fitness destination accepts one HTTPS origin, not paths, credentials or caller URLs', () => {
  assert.equal(fitnessOrigin('https://fitness.example.com'), 'https://fitness.example.com');
  for (const x of [
    'javascript:alert(1)',
    'http://fitness.example.com',
    'https://user@fitness.example.com',
    'https://fitness.example.com/callback',
    'https://fitness.example.com?return=evil',
  ])
    assert.equal(fitnessOrigin(x), null);
});
test('fitness grants require valid issuer/audience/state/nonce/identity and bounded expiry', () => {
  const secret = randomBytes(32).toString('hex'),
    now = Date.now();
  const data = {
    iss: 'student-hub-egypt',
    aud: 'fitness-club',
    nonce: randomUUID(),
    state: randomBytes(24).toString('base64url'),
    hub_user_id: 'test-user',
    name: 'طالب',
    email: 'student@example.test',
    exp: Math.floor(now / 1000) + 300,
  };
  const sign = (d: unknown) => {
    const p = Buffer.from(JSON.stringify(d)).toString('base64url');
    return p + '.' + createHmac('sha256', secret).update(p).digest('base64url');
  };
  assert.equal(verifyFitnessCode(sign(data), secret, now)?.hub_user_id, 'test-user');
  for (const d of [
    { ...data, iss: 'other' },
    { ...data, aud: 'other' },
    { ...data, state: 'bad' },
    { ...data, nonce: 'bad' },
    { ...data, exp: 0 },
    { ...data, exp: Math.floor(now / 1000) + 9999 },
    { ...data, exp: '99999999999' },
  ])
    assert.equal(verifyFitnessCode(sign(d), secret, now), null);
  assert.equal(verifyFitnessCode(sign(data) + 'a', secret, now), null);
  assert.equal(verifyFitnessCode(sign(data), randomBytes(32).toString('hex'), now), null);
});
