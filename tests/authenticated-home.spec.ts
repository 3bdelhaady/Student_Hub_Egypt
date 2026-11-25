import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('landing is guest only; signed-in student admin and agent return to their workspace', async ({
  browser,
}) => {
  for (const [role, target] of [
    ['demostudent', /\/courses(?:\/[^/?#]+)?$/],
    ['demoadmin', /\/admin\?tab=institutions$/],
    ['demoagent', /\/agent/],
  ] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Keep each sign-in outside the shared authentication rate-limit window.
    await page.waitForTimeout(11000);
    await page.goto('/login');
    await page.locator('[name=email]').fill(accounts[role].email);
    await page.locator('[name=password]').fill(accounts[role].password);
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    await expect(page).not.toHaveURL(/login/);
    await page.goto('/');
    await expect(page).toHaveURL(target);
    await expect(page.locator('.reference-home')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    await page.reload();
    await expect(page).toHaveURL(target);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: test.info().outputPath(role + '-home.png') });
    await context.close();
  }
  const guest = await browser.newContext();
  const page = await guest.newPage();
  await page.goto('/');
  await expect(page.locator('.reference-home')).toBeVisible();
  await guest.close();
});
