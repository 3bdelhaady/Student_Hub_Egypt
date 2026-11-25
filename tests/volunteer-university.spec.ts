import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('volunteering shows own faculty union, all university activities, and rejects foreign union submission', async ({
  page,
}) => {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demostudent.email);
  await page.locator('[name=password]').fill(accounts.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/services?kind=volunteer');
  const select = page.getByLabel('اتحاد الطلاب والأنشطة الطلابية بجامعتك');
  await expect(select).toBeVisible();
  const options = await select.locator('option').allTextContents();
  expect(options.some((v) => v.includes('كلية اختبار أخرى'))).toBe(true);
  expect(options.some((v) => v.includes('اتحاد'))).toBe(true);
  expect(options.filter((v) => v.includes('اتحاد'))).toHaveLength(1);
  expect(options.some((v) => v.includes('نشاط اختبار كلية أخرى'))).toBe(true);
  const form = page.locator('.organization-volunteer-form');
  await form
    .locator('[name=organizationId]')
    .evaluate((e) => ((e as HTMLInputElement).value = 'default-union-test-other-faculty'));
  await form.locator('[name=applicationConsent]').check();
  await form.getByRole('button', { name: 'تقديم طلب تطوع', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('تعذر إرسال');

  await page.screenshot({
    path: test.info().outputPath('volunteer-university-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('volunteer-university-mobile.png'),
    fullPage: true,
  });
});
