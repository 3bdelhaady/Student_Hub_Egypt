import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: Page, key: string) {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
}
test('student can volunteer year round directly to an existing organization without a published opportunity', async ({
  page,
}) => {
  await login(page, 'demostudent');
  await page.goto('/services?kind=volunteer');
  const form = page
    .locator('.organization-volunteer-form')
    .filter({ has: page.locator('[name=organizationId]') });
  await expect(form).toBeVisible();
  await form.locator('[name=notes]').fill('طلب مشاركة في التنظيم والمتابعة');
  await form.locator('[name=applicationConsent]').check();
  await form.getByRole('button', { name: 'تقديم طلب تطوع', exact: true }).click();
  await expect(form.getByRole('status')).toContainText('تم استلام');
  await page.goto('/requests');
  await expect(page.getByText('اتحاد طلاب الحاسبات', { exact: true }).first()).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('volunteering-year-round.png'),
    fullPage: true,
  });
  await page.goto('/profile?edit=details');
  await expect(page.locator('input[name=department]')).toHaveCount(0);
});
test('student code is stable, owner/admin readable and absent from session API', async ({
  page,
  browser,
}) => {
  await login(page, 'demostudent');
  await page.goto('/profile');
  const form = page.locator('form').filter({ has: page.locator('[name=gender]') });
  if (await form.count()) {
    await form.locator('[name=gender]').selectOption('male');
  }
  await expect(page.getByTestId('student-code')).toBeVisible();
  const code = await page.getByTestId('student-code').textContent();
  expect(code).toMatch(/^STM[A-F0-9]{16}$/);
  await expect(page.locator('[name=nationalId]')).toHaveCount(0);
  const session = await page.request.get('/api/auth/get-session');
  expect(await session.text()).not.toContain(code!);
  const ownId = (await session.json()).user.id;
  await page.reload();
  await expect(page.getByTestId('student-code')).toHaveText(code!);
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await login(p, 'demoagent');
  await p.goto('/manage/student-code?user=' + ownId);
  await expect(p.getByText(code!, { exact: true })).toHaveCount(0);
  await ctx.close();
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login(page, 'demoadmin');
  await page.goto('/manage/student-code?user=' + ownId);
  await expect(page.getByText(code!, { exact: true })).toBeVisible();
});
