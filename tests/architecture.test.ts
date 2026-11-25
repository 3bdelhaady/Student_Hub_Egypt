import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const modules = ['identity', 'catalog', 'membership', 'content', 'learning'];
test('domain modules expose their own server actions and do not call other domains actions', () => {
  for (const domain of modules) {
    const file = path.join('src/modules', domain, 'actions.ts');
    const text = fs.readFileSync(file, 'utf8');
    assert.match(text, /^'use server';/);
    assert.match(text, /require(?:Student)?Viewer/);
    for (const other of modules.filter((name) => name !== domain)) {
      assert.ok(!text.includes(`/modules/${other}/actions`), `${domain} imports ${other} actions`);
    }
  }
  assert.equal(fs.existsSync('src/modules/actions.ts'), false);
});
test('schema exposes explicit domains and hosted deployments fail closed without PostgreSQL', () => {
  const schema = fs.readFileSync('src/db/schema.ts', 'utf8');
  for (const name of ['identity', 'catalog', 'membership', 'content', 'learning', 'platform'])
    assert.ok(schema.includes(`./schema/${name}`));
  const driver = fs.readFileSync('src/db/index.ts', 'utf8');
  assert.match(driver, /process\.env\.VERCEL/);
  assert.match(driver, /Production requires DATABASE_URL/);
});
