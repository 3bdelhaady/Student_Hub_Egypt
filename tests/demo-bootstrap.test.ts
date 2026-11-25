import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

test('isolated v2 creation, legacy refusal, approved rotation and session revocation are atomic', () => {
  const root = process.cwd();
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hub-demo-test-'));
  const env = {
    ...process.env,
    DATABASE_URL: '',
    VERCEL: '',
    DEMO_MODE: 'true',
    DEMO_PROVISION_ALLOW_LOCAL: 'true',
  };
  for (const key of Object.keys(env))
    if (key.startsWith('DEMO_PROVISION_')) delete env[key as keyof typeof env];
  env.DEMO_PROVISION_ALLOW_LOCAL = 'true';
  const fresh = () =>
    Object.fromEntries(
      ['STUDENT', 'AGENT', 'ADMIN'].map((role) => [
        `DEMO_PROVISION_${role}_PASSWORD`,
        randomBytes(32).toString('base64url'),
      ]),
    );
  const run = (file: string, extra: Record<string, string> = {}) =>
    spawnSync(
      process.execPath,
      ['--import', path.join(root, 'node_modules/tsx/dist/loader.mjs'), path.resolve(root, file)],
      { cwd: temp, env: { ...env, ...extra }, encoding: 'utf8', timeout: 30000 },
    );
  const ok = (file: string, extra: Record<string, string> = {}) => {
    const r = run(file, extra);
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
  };
  const status = () => JSON.parse(ok('scripts/demo-status.ts').trim());
  try {
    fs.symlinkSync(path.join(root, 'migrations'), path.join(temp, 'migrations'), 'dir');
    ok('scripts/migrate.ts');
    ok('scripts/seed.ts');
    assert.equal(status().demoProvisionStatus, 'not_provisioned');
    const first = fresh();
    assert.notEqual(
      run('scripts/provision-demo.ts', {
        ...first,
        DEMO_PROVISION_V2_ENABLED: 'true',
        DEMO_PROVISION_PASSWORD: 'withdrawn-test-value',
      }).status,
      0,
    );
    assert.equal(status().reservedAccounts, 0);
    assert.match(
      ok('scripts/provision-demo.ts', { ...first, DEMO_PROVISION_V2_ENABLED: 'true' }),
      /created atomically/,
    );
    assert.equal(status().demoProvisionStatus, 'separate_credentials_v2');
    assert.match(
      ok('scripts/provision-demo.ts', { ...fresh(), DEMO_PROVISION_V2_ENABLED: 'true' }),
      /already provisioned/,
    );
    // Only synthetic local accounts are converted into a v1 fixture. No live URL is involved.
    const fixture = path.join(temp, 'legacy-fixture.ts');
    fs.writeFileSync(
      fixture,
      `
import {db} from ${JSON.stringify(path.join(root, 'src/db/index.ts'))};
import * as s from ${JSON.stringify(path.join(root, 'src/db/schema.ts'))};
import {eq,inArray} from ${JSON.stringify(path.join(root, 'node_modules/drizzle-orm/index.js'))};
import {hashPassword} from ${JSON.stringify(path.join(root, 'node_modules/better-auth/dist/crypto/index.mjs'))};
async function main(){
 const names=['demo.student@studenthub.test','demo.agent@studenthub.test','demo.admin@studenthub.test'];
 const people=await db.select().from(s.user).where(inArray(s.user.email,names));
 await db.delete(s.demoProvisionRuns).where(eq(s.demoProvisionRuns.id,'demo-accounts-v2'));
 await db.insert(s.demoProvisionRuns).values({id:'demo-accounts-v1'});
 const hash=await hashPassword(process.env.TMP_LEGACY_TEST_PASSWORD!);
 await db.update(s.account).set({password:hash}).where(inArray(s.account.userId,people.map(p=>p.id)));
 for(const p of people)await db.insert(s.session).values({id:crypto.randomUUID(),userId:p.id,token:crypto.randomUUID(),createdAt:new Date(),updatedAt:new Date(),expiresAt:new Date(Date.now()+60000)});
 console.log('Synthetic legacy fixture prepared');process.exit(0);
}void main();`,
    );
    const legacyPassword = randomBytes(32).toString('base64url');
    ok(fixture, { TMP_LEGACY_TEST_PASSWORD: legacyPassword });
    assert.equal(status().demoProvisionStatus, 'legacy_v1_requires_owner_approved_rotation');
    const replacement = fresh();
    assert.notEqual(
      run('scripts/provision-demo.ts', { ...replacement, DEMO_PROVISION_V2_ENABLED: 'true' })
        .status,
      0,
    );
    assert.equal(status().demoProvisionStatus, 'legacy_v1_requires_owner_approved_rotation');
    assert.notEqual(
      run('scripts/provision-demo.ts', {
        ...replacement,
        DEMO_PROVISION_ADMIN_PASSWORD: legacyPassword,
        DEMO_PROVISION_V2_ENABLED: 'true',
        DEMO_PROVISION_ROTATE_LEGACY: 'true',
      }).status,
      0,
    );
    assert.equal(status().demoProvisionStatus, 'legacy_v1_requires_owner_approved_rotation');
    assert.match(
      ok('scripts/provision-demo.ts', {
        ...replacement,
        DEMO_PROVISION_V2_ENABLED: 'true',
        DEMO_PROVISION_ROTATE_LEGACY: 'true',
      }),
      /sessions revoked/,
    );
    assert.equal(status().demoProvisionStatus, 'separate_credentials_v2');
    const check = path.join(temp, 'verify-rotation.ts');
    fs.writeFileSync(
      check,
      `
import {db} from ${JSON.stringify(path.join(root, 'src/db/index.ts'))};
import * as s from ${JSON.stringify(path.join(root, 'src/db/schema.ts'))};
import {verifyPassword} from ${JSON.stringify(path.join(root, 'node_modules/better-auth/dist/crypto/index.mjs'))};
async function main(){
 const accounts=await db.select().from(s.account);const people=await db.select().from(s.user);
 if((await db.select().from(s.session)).length!==0)throw new Error('Sessions survived rotation');
 for(const role of ['student','agent','admin']){
 const p=people.find(p=>p.email==='demo.'+role+'@studenthub.test')!;const a=accounts.find(a=>a.userId===p.id)!;
 if(!await verifyPassword({hash:a.password!,password:process.env['DEMO_PROVISION_'+role.toUpperCase()+'_PASSWORD']!}))throw new Error('Replacement did not take');
 if(await verifyPassword({hash:a.password!,password:process.env.TMP_LEGACY_TEST_PASSWORD!}))throw new Error('Legacy credential survived');
 }
 console.log('Independent replacements and revoked sessions verified');process.exit(0);
}void main();`,
    );
    assert.match(
      ok(check, { ...replacement, TMP_LEGACY_TEST_PASSWORD: legacyPassword }),
      /verified/,
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
