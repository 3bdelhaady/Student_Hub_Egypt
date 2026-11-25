import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDemoConfig } from '../scripts/lib/demo-config';
const base = {
  DEMO_MODE: 'true',
  DEMO_PROVISION_ALLOW_LOCAL: 'true',
  DEMO_PROVISION_V2_ENABLED: 'true',
  DEMO_PROVISION_STUDENT_PASSWORD: 'student-independent-test-value-1',
  DEMO_PROVISION_AGENT_PASSWORD: 'agent-independent-test-value-2',
  DEMO_PROVISION_ADMIN_PASSWORD: 'admin-independent-test-value-3',
};
test('legacy and partially configured provisioning fail closed without logging values', () => {
  assert.throws(() => readDemoConfig({ ...base, DEMO_PROVISION_PASSWORD: 'rejected' }), /Legacy/);
  assert.throws(() => readDemoConfig({ ...base, DEMO_PROVISION_ENABLED: 'true' }), /Legacy/);
  assert.throws(() => readDemoConfig({ DEMO_PROVISION_STUDENT_PASSWORD: 'unused' }), /Partial/);
  assert.equal(readDemoConfig({}).mode, 'disabled');
});
test('three distinct credentials required, never one credential across privilege boundaries', () => {
  assert.equal(readDemoConfig(base).mode, 'provision');
  assert.throws(
    () =>
      readDemoConfig({
        ...base,
        DEMO_PROVISION_AGENT_PASSWORD: base.DEMO_PROVISION_ADMIN_PASSWORD,
      }),
    /distinct/,
  );
  assert.throws(
    () => readDemoConfig({ ...base, DEMO_PROVISION_STUDENT_PASSWORD: 'short' }),
    /distinct/,
  );
  assert.throws(
    () => readDemoConfig({ ...base, DEMO_PROVISION_ADMIN_PASSWORD: undefined }),
    /distinct/,
  );
});
test('preview, non-demo and unacknowledged local writes are rejected; status-only is a read', () => {
  assert.throws(
    () => readDemoConfig({ ...base, VERCEL: '1', VERCEL_ENV: 'preview' }),
    /Production/,
  );
  assert.throws(() => readDemoConfig({ ...base, DEMO_MODE: 'false' }), /Demo/);
  assert.throws(() => readDemoConfig({ ...base, DEMO_PROVISION_ALLOW_LOCAL: undefined }), /local/);
  assert.deepEqual(
    readDemoConfig({
      ...base,
      DEMO_PROVISION_STATUS_ONLY: 'true',
      DEMO_PROVISION_PASSWORD: 'unused',
    }),
    { mode: 'status' },
  );
  const normal = readDemoConfig(base);
  assert.equal(normal.mode === 'provision' && normal.rotateLegacy, false);
});
