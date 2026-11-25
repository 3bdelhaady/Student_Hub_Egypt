import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('housing fields persist, filters and gallery render, checkout rejects electronic and keeps cash unpaid', async ({
  page,
}) => {
  test.setTimeout(115000);
  async function login(key: string) {
    await page.waitForTimeout(11000);
    await page.goto('/login');
    await page.locator('[name=email]').fill(accounts[key].email);
    await page.locator('[name=password]').fill(accounts[key].password);
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);
  }
  await login('demoadmin');
  await page.goto('/manage?new=1');
  await page.getByLabel('المؤسسة', { exact: true }).selectOption({ label: 'مصادر التعلم' });
  await page.locator('[name=kind]').selectOption('housing');
  const title = 'سكن فحص محلي ' + Date.now();
  await page.getByLabel('العنوان', { exact: true }).fill(title);
  await page
    .getByLabel('الوصف والتفاصيل')
    .fill('بيانات اختبار محلي للسكن، ليست إعلانًا حقيقيًا أو عنوانًا فعليًا.');
  await page.getByLabel('السعر بالجنيه المصري').fill('850');
  await page.locator('[name=housingType]').selectOption('apartment');
  await page.locator('[name=housingAudience]').selectOption('male');
  await page.locator('[name=housingRooms]').fill('3');
  await page.locator('[name=housingBeds]').fill('6');
  await page.locator('[name=housingResidents]').fill('4');
  await page.locator('[name=housingDeposit]').fill('500');
  await page.locator('[name=housingServiceFee]').fill('200');
  await page.locator('[name=housingWater]').check();
  await page.locator('[name=housingWifi]').check();
  await page.getByLabel('منشور للطلاب داخل النطاق').check();
  await page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('demostudent');
  await page.goto('/store?kind=housing');
  await page.getByLabel('بحث', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'تصفية النتائج' }).click();
  await page.getByRole('link', { name: title, exact: true }).click();
  await expect(page).toHaveURL(/\/store\/[^/?]+$/);
  const detail = page.url();
  await expect(page.getByText('3 غرف', { exact: true })).toBeVisible();
  await expect(page.getByText('واي فاي', { exact: true })).toBeVisible();
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const a = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(a.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
        [],
      );
      await page.screenshot({
        path: test.info().outputPath('housing-detail-' + theme + '-' + width + '.png'),
        fullPage: true,
      });
    }
  await page.getByRole('link', { name: 'احجز الآن', exact: true }).click();
  await page.getByRole('radio', { name: /إلكتروني/ }).check();
  await expect(page.getByRole('button', { name: 'شحن أموال للكرت' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'دفع وإتمام عملية الشراء' })).toBeDisabled();
  await page.getByRole('radio', { name: /كاش/ }).check();
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath('checkout-' + theme + '-' + width + '.png'),
        fullPage: true,
      });
    }
  await page.getByRole('button', { name: 'دفع وإتمام عملية الشراء' }).click();
  await page.getByRole('link', { name: 'متابعة هذا الطلب', exact: true }).click();
  await expect(
    page.getByText('طريقة الدفع: كاش، لم يُحصّل مبلغ عبر الموقع', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.status-pill')).toHaveText('قيد المراجعة');
  await expect(page.getByRole('button', { name: 'إلغاء طلبي' })).toHaveCount(0);
  await page.goto(detail);
  await expect(page.getByRole('link', { name: 'متابعة هذا الطلب', exact: true })).toBeVisible();
});
