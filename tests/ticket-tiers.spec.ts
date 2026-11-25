import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('event types and ticket tiers save, reopen and price student requests on the server', async ({
  page,
}) => {
  test.setTimeout(110000);
  async function login(key: string) {
    await page.waitForTimeout(11000);
    await page.goto('/login');
    await page.locator('[name=email]').fill(accounts[key].email);
    await page.locator('[name=password]').fill(accounts[key].password);
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    await expect(page).not.toHaveURL(/login/);
  }
  await login('storereview');
  await page.goto('/agent?kind=ticket&new=1');
  const title = 'أمسية طلابية ' + Date.now();
  await page.getByLabel('اسم العنصر', { exact: true }).fill(title);
  await page
    .getByLabel('الوصف', { exact: true })
    .fill('برنامج موسيقي للطلاب مع خيارات متعددة للتذاكر');
  await expect(page.getByLabel('نوع الفعالية').locator('option')).toHaveCount(4);
  await page.getByLabel('نوع الفعالية').selectOption('standup');
  await page.getByLabel('اسم نوع التذكرة 1', { exact: true }).fill('عادية');
  await page.getByLabel('وصف التذكرة 1', { exact: true }).fill('دخول عادي');
  await page.getByLabel('سعر التذكرة 1', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'إضافة نوع تذكرة آخر', exact: true }).click();
  await page.getByLabel('اسم نوع التذكرة 2', { exact: true }).fill('مميزة');
  await page.getByLabel('وصف التذكرة 2', { exact: true }).fill('مقاعد مميزة قرب المسرح');
  await page.getByLabel('سعر التذكرة 2', { exact: true }).fill('250');
  await page.getByRole('button', { name: 'حفظ العنصر', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/agent?kind=ticket');
  await page
    .locator('tbody tr')
    .filter({ hasText: title })
    .getByRole('link', { name: 'تعديل', exact: true })
    .click();
  await expect(page).toHaveURL(/edit=/);
  const id = new URL(page.url()).searchParams.get('edit');
  await expect(page.getByLabel('نوع الفعالية')).toHaveValue('standup');
  await expect(page.getByLabel('سعر التذكرة 2', { exact: true })).toHaveValue('250');
  await page.screenshot({
    path: test.info().outputPath('ticket-tiers-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('ticket-tiers-mobile.png'),
    fullPage: true,
  });
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('demostudent');
  await page.goto('/store/' + id);
  await expect(page.getByRole('heading', { name: 'مميزة', exact: true })).toBeVisible();
  await page.goto('/store/' + id + '/checkout');
  const select = page.getByRole('combobox', { name: 'نوع التذكرة', exact: true });
  const vip = await select.locator('option').last().getAttribute('value');
  await select.selectOption(vip!);
  await page.getByLabel('الكمية', { exact: true }).fill('2');
  await expect(page.locator('.request-cost')).toContainText('٥٠٠');
  await page.screenshot({
    path: test.info().outputPath('ticket-student-checkout.png'),
    fullPage: true,
  });
  await select.evaluate((el: HTMLSelectElement) => {
    const op = document.createElement('option');
    op.value = 'fake';
    el.add(op);
    el.value = 'fake';
  });
  await page.getByRole('button', { name: 'دفع وإتمام عملية الشراء' }).click();
  await expect(page.locator('.form-error')).toBeVisible();
  await select.selectOption(vip!);
  await page.getByRole('button', { name: 'دفع وإتمام عملية الشراء' }).click();
  await page.getByRole('link', { name: 'متابعة هذا الطلب', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'مميزة', exact: true })).toBeVisible();
  await expect(page.getByText('مقاعد مميزة قرب المسرح', { exact: true })).toBeVisible();
});
