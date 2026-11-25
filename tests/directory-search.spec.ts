import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('admin search finds old rows beyond initial hundred and detail still works', async ({
  page,
  browser,
}) => {
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demoadmin.email);
  await page.locator('[name=password]').fill(accounts.demoadmin.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/admin/);
  await page.goto('/admin?tab=institutions');
  await expect(page.locator('tbody')).not.toContainText('اختبار بحث عميق أقدم');
  const response = page.waitForResponse(
    (r) => r.request().method() === 'POST' && Boolean(r.request().headers()['next-action']),
  );
  await page.getByPlaceholder('ابحث باسم المؤسسة...').fill('اختبار بحث عميق أقدم');
  const req = (await response).request();
  const row = page.locator('tbody tr').filter({ hasText: 'اختبار بحث عميق أقدم' });
  await expect(row).toBeVisible();
  await row.getByRole('link').click();
  await expect(page.getByLabel('اسم المؤسسة', { exact: true })).toHaveValue('اختبار بحث عميق أقدم');
  const context = await browser.newContext();
  const rejected = await context.request.post('http://localhost:3000/admin?tab=institutions', {
    headers: {
      'next-action': req.headers()['next-action'],
      'content-type': req.headers()['content-type'],
      origin: 'http://localhost:3000',
    },
    data: req.postData()!,
  });
  expect(await rejected.text()).not.toContain('search-proof-0');
  await context.close();
});
