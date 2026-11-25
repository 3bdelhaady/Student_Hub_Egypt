import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('activity coordinator academic grants are hidden and new forged grants fail', async ({
  page,
}) => {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demoadmin.email);
  await page.locator('[name=password]').fill(accounts.demoadmin.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/admin?tab=agents&edit=section-fixture-agent-sectionactivity');
  const form = page.locator('.console-agent-detail form');
  await expect(form.locator('[name="academic.canRead"]')).toHaveCount(0);
  await expect(form.locator('[name="team.canRead"]')).toHaveCount(0);
  await form.evaluate((e) => {
    const i = document.createElement('input');
    i.name = 'academic.canRead';
    i.value = 'on';
    i.type = 'hidden';
    e.append(i);
  });
  await form.getByRole('button', { name: 'تأكيد الصلاحيات', exact: true }).click();
  await expect(form.getByRole('alert')).toBeVisible();
});
