import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('private-sector dashboard unifies four sections and safely archives commerce items', async ({
  page,
}) => {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.storereview.email);
  await page.locator('[name=password]').fill(accounts.storereview.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/agent');
  await expect(page).toHaveURL(/\/agent$/);
  await expect(
    page
      .getByRole('navigation', { name: 'أقسام الوكيل' })
      .getByRole('link', { name: 'الخدمات والطلبات', exact: true }),
  ).toHaveCount(0);
  const nav = page.getByRole('complementary', { name: 'أقسام لوحتي' });
  for (const [kind, label] of [
    ['product', 'المتجر الأكاديمي'],
    ['housing', 'السكن الطلابي'],
    ['restaurant', 'المطاعم والكافيهات'],
    ['ticket', 'التذاكر الإلكترونية'],
  ]) {
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp('agent\\?kind=' + kind + '$'));
    await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '+ إضافة عنصر', exact: true })).toBeVisible();
    await expect(
      page.locator('tbody tr').first().getByRole('link', { name: 'تعديل', exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('tbody tr').first().getByRole('button', { name: 'حذف العنصر', exact: true }),
    ).toBeVisible();
    await page
      .locator('tbody tr')
      .first()
      .getByRole('link', { name: 'مراجعة الطلبات', exact: true })
      .click();
    await expect(page.getByRole('link', { name: 'كل طلبات القسم', exact: true })).toBeVisible();
  }
  await page.goto('/manage?kind=housing');
  await expect(page).toHaveURL(/agent\?kind=housing$/);
  await page.screenshot({ path: test.info().outputPath('commerce-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('commerce-mobile.png'), fullPage: true });
  await page.goto('/agent?kind=product&new=1');
  await expect(page.getByLabel('اسم العنصر', { exact: true })).toBeVisible();
  await page.getByLabel('اسم العنصر', { exact: true }).fill('عنصر تحقق مؤقت للحذف');
  await page
    .getByLabel('الوصف', { exact: true })
    .fill('عنصر تحقق محلي لضمان عمل الإضافة والحذف دون فقد الطلبات.');
  await page.getByLabel('السعر بالجنيه المصري').fill('25');
  await page.getByRole('button', { name: 'حفظ العنصر' }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/agent?kind=product');
  const row = page.locator('tbody tr').filter({ hasText: 'عنصر تحقق مؤقت للحذف' });
  await row.getByRole('checkbox').check();
  await row.getByRole('button', { name: 'حذف العنصر', exact: true }).click();
  await expect(row).toHaveCount(0);
});
