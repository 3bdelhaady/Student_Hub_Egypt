import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('neutral Coordinator overview contains only authorized section choices until one is selected', async ({
  page,
}) => {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.union.email);
  await page.locator('[name=password]').fill(accounts.union.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/manage');
  const availableCount = await page.locator('.portal-kind-grid a').count();
  expect(availableCount).toBeGreaterThan(0);
  await expect(page.locator('.manage-screen .resource-tabs')).toHaveCount(0);
  await expect(page.locator('#section-content')).toHaveCount(0);
  for (const name of ['لوحة الإدارة', 'تفعيل الفرق للمقررات وشروطها', '+ إضافة خدمة أو منتج'])
    await expect(
      page.locator('.manage-screen').getByRole('link', { name, exact: true }),
    ).toHaveCount(0);
  await page.getByRole('link', { name: 'رابط الطلاب', exact: true }).click();
  await expect(page.locator('#section-content')).toBeVisible();
  await expect(page.getByRole('link', { name: 'إضافة فرصة تدريب', exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'تفعيل الفرق للمقررات وشروطها', exact: true }),
  ).toHaveCount(0);
  await page.goto('/manage?kind=team');
  await expect(page.locator('.manage-screen .resource-tabs')).toHaveCount(0);
  await expect(page.locator('.management-section-tabs')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'تفعيل فريق أكاديمي لمقرر دراسي', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '+ إضافة خدمة أو منتج', exact: true })).toHaveCount(
    0,
  );
  await page.goto('/manage?new=1&kind=team');
  await expect(page).toHaveURL(/manage\/team-settings/);
  await expect(page.locator('[name=approvalRequired]')).toBeVisible();
  await page.goto('/manage?kind=volunteer');
  for (const name of ['عرض العناصر', 'إضافة عنصر جديد', 'طلبات التطوع'])
    await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
});
