import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('student affairs page focuses on faculty activation and rejects out-of-faculty ids', async ({
  page,
}) => {
  test.setTimeout(85000);
  await new Promise((r) => setTimeout(r, 11000));
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demoagent.email);
  await page.locator('[name=password]').fill(accounts.demoagent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/agent/);
  await expect(page.getByRole('heading', { name: 'إدارة طلاب الكلية' })).toBeVisible();
  await expect(page.locator('#domain-content')).toHaveCount(0);
  await expect(page.locator('#institution-team')).toHaveCount(0);
  await expect(page.getByText('مسؤولو الاتحاد والأنشطة', { exact: true })).toHaveCount(0);
  const row = page.locator('tr').filter({ hasText: accounts.demostudent.email });
  await expect(row).toBeVisible();
  if (await row.getByRole('button', { name: 'تفعيل العضوية' }).count()) {
    await row.getByLabel('أؤكد تغيير حالة هذا الطالب').check();
    await row.getByRole('button', { name: 'تفعيل العضوية' }).click();
    await expect(row.getByRole('status')).toContainText('تفعيل عضوية');
    await page.reload();
  }
  const memberId = await row.locator('[name=membershipId]').inputValue();
  await row.getByLabel('أؤكد تغيير حالة هذا الطالب').check();
  await page.route('**/agent', async (route) => {
    const request = route.request(),
      data = request.postData();
    if (request.method() === 'POST' && data?.includes('membershipId')) {
      return route.continue({
        postData: data.replaceAll(memberId, 'nonexistent-cross-faculty-id'),
      });
    }
    return route.continue();
  });
  await row.getByRole('button', { name: 'إيقاف العضوية' }).click();
  await expect(row.getByRole('alert')).toBeVisible();
  await page.unroute('**/agent');
  await page.reload();
  const target = page.locator('tr').filter({ hasText: accounts.demostudent.email });
  await target.getByLabel('أؤكد تغيير حالة هذا الطالب').check();
  await target.getByRole('button', { name: 'إيقاف العضوية' }).click();
  await expect(target.getByRole('status')).toContainText('إيقاف عضوية');
  await expect(target.getByRole('button', { name: 'تفعيل العضوية' })).toBeVisible();
  await target.getByLabel('أؤكد تغيير حالة هذا الطالب').check();
  await target.getByRole('button', { name: 'تفعيل العضوية' }).click();
  await expect(target.getByRole('status')).toContainText('تفعيل عضوية');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`hub-affairs-students-${width}.png`),
      fullPage: true,
    });
  }
});
