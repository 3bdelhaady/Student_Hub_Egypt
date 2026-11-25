import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('restaurant menu persists, cart calculates from published prices and creates unpaid cash order', async ({
  page,
}) => {
  test.setTimeout(105000);
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
  await page.locator('[name=kind]').selectOption('restaurant');
  const title = 'مطعم فحص محلي ' + Date.now();
  await page.getByLabel('العنوان', { exact: true }).fill(title);
  await page
    .getByLabel('الوصف والتفاصيل')
    .fill('مطعم اختبار محلي فقط، لا يمثل مطعمًا فعليًا أو خدمة توصيل حقيقية.');
  await page.getByRole('button', { name: 'إضافة صنف للقائمة' }).click();
  await page.getByLabel('اسم الصنف', { exact: true }).fill('بيتزا اختبار محلية');
  await page.getByLabel('قسم القائمة', { exact: true }).fill('بيتزا');
  await page.getByLabel('السعر بالجنيه', { exact: true }).fill('100');
  await page.getByLabel('وصف الصنف', { exact: true }).fill('وصف صنف محلي لفحص القائمة والسلة.');
  await page.getByLabel('منشور للطلاب داخل النطاق').check();
  await page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('demostudent');
  await page.goto('/store?kind=restaurant');
  await page.getByRole('link', { name: title, exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'بيتزا اختبار محلية', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'أضف إلى الطلب' }).click();
  await page.getByRole('button', { name: 'زيادة بيتزا اختبار محلية' }).click();
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations.map(
          (v) => v.id,
        ),
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath('restaurant-menu-' + theme + '-' + width + '.png'),
        fullPage: true,
      });
    }
  await page.getByRole('link', { name: /عرض الطلب، 2/ }).click();
  await expect(page.getByText('بيتزا اختبار محلية × 2', { exact: true })).toBeVisible();
  const digest = await page.locator('[name=checkoutDigest]').inputValue();
  await page
    .locator('[name=checkoutDigest]')
    .evaluate((e: HTMLInputElement) => (e.value = 'stale'));
  await page.getByRole('button', { name: 'دفع وإتمام عملية الشراء' }).click();
  await expect(page.locator('.form-error')).toBeVisible();
  await page
    .locator('[name=checkoutDigest]')
    .evaluate((e: HTMLInputElement, v) => (e.value = v), digest);
  const cart = await page.locator('[name=cart]').inputValue();
  await page
    .locator('[name=cart]')
    .evaluate((e: HTMLInputElement) => (e.value = '[{"id":"foreign-item","quantity":1}]'));
  await page.getByRole('button', { name: 'دفع وإتمام عملية الشراء' }).click();
  await expect(page.locator('.form-error')).toBeVisible();
  await page.locator('[name=cart]').evaluate((e: HTMLInputElement, v) => (e.value = v), cart);
  await page.getByRole('radio', { name: /إلكتروني/ }).check();
  const submit = page.getByRole('button', { name: 'دفع وإتمام عملية الشراء' });
  await submit.evaluate((e: HTMLButtonElement) => (e.disabled = false));
  await submit.click();
  await expect(page.locator('.form-error')).toContainText('غير متاح');
  await page.getByRole('radio', { name: /كاش/ }).check();
  await page.getByRole('button', { name: 'دفع وإتمام عملية الشراء' }).click();
  await page.getByRole('link', { name: 'متابعة هذا الطلب', exact: true }).click();
  await expect(
    page.getByText('طريقة الدفع: كاش، لم يُحصّل مبلغ عبر الموقع', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/بيتزا اختبار محلية × 2،/)).toBeVisible();
  const orderUrl = page.url();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('storereview');
  await page.goto(orderUrl);
  await expect(
    page.getByRole('heading', { name: 'هذه الصفحة غير موجودة.', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/بيتزا اختبار محلية × 2،/)).toHaveCount(0);
});
