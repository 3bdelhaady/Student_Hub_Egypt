import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  emailSecurityConfig,
  needsEmailVerification,
} from '../src/modules/identity/email-security';
import { authEmailContent } from '../src/lib/auth-email';
test('email gate preserves old accounts and requires complete setup', () => {
  assert.equal(emailSecurityConfig({}).enabled, false);
  assert.throws(() => emailSecurityConfig({ AUTH_EMAIL_ENABLED: 'true' }));
  const config = { enabled: true, requiredFrom: Date.parse('2026-01-01') };
  assert.equal(
    needsEmailVerification({ emailVerified: false, createdAt: '2025-01-01' }, config),
    false,
  );
  assert.equal(
    needsEmailVerification({ emailVerified: false, createdAt: '2026-02-01' }, config),
    true,
  );
  assert.equal(
    needsEmailVerification({ emailVerified: true, createdAt: '2026-02-01' }, config),
    false,
  );
  assert.throws(() =>
    authEmailContent(
      'reset',
      'https://evil.example/api/auth/reset-password/x',
      'https://hub.example',
    ),
  );
});
test('disposable verification and recovery integration', () => {
  const root = process.cwd(),
    temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hub-email-test-'));
  const env = {
    ...process.env,
    DATABASE_URL: '',
    VERCEL: '',
    DEMO_MODE: 'true',
    BETTER_AUTH_URL: 'http://localhost:3000',
    BETTER_AUTH_SECRET: randomBytes(40).toString('hex'),
    AUTH_EMAIL_ENABLED: 'true',
    AUTH_EMAIL_REQUIRED_FROM: '2026-01-01T00:00:00Z',
    AUTH_EMAIL_FROM: 'test@example.test',
    RESEND_API_KEY: 'disposable-mocked-no-actual-key',
  };
  const run = (file: string) =>
    spawnSync(
      process.execPath,
      ['--import', path.join(root, 'node_modules/tsx/dist/loader.mjs'), path.join(root, file)],
      { cwd: temp, env, encoding: 'utf8', timeout: 45000 },
    );
  try {
    fs.symlinkSync(path.join(root, 'migrations'), path.join(temp, 'migrations'));
    fs.symlinkSync(path.join(root, 'tsconfig.json'), path.join(temp, 'tsconfig.json'));
    fs.symlinkSync(path.join(root, 'src'), path.join(temp, 'src'));
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'));
    const migration = run('scripts/migrate.ts');
    assert.equal(migration.status, 0, migration.stderr);
    const result = run('scripts/test-email-security.ts');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Verified signup/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
