import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: Page, key: string) {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function logout(page: Page) {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
}
test('student selects own university unit, union gets private inbox and replies, admin nav has only requested sections', async ({
  page,
}) => {
  test.setTimeout(120000);
  await login(page, 'demostudent');
  await page.goto('/help');
  await page.screenshot({
    path: test.info().outputPath('support-recipient-desktop.png'),
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: test.info().outputPath('support-recipient-mobile.png'),
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1100 });
  const recipient = page.locator('select[name=recipient]');
  const options = await recipient.locator('option').allTextContents();
  expect(options.some((t) => t.includes('شؤون الطلاب'))).toBe(true);
  expect(options.some((t) => t.includes('اتحاد الطلاب'))).toBe(true);
  expect(options.some((t) => t.includes('نشاط عبر كليات الجامعة'))).toBe(true);
  expect(options.some((t) => t.includes('اتحاد كلية أخرى'))).toBe(false);
  const target = await recipient
    .locator('option')
    .evaluateAll(
      (els) =>
        (els as HTMLOptionElement[]).find((e) => e.value.includes('student_union'))?.value || '',
    );
  expect(target).not.toBe('');
  await recipient.selectOption(target);
  const subject = 'رسالة اتحاد محلية ' + Date.now();
  await page.getByLabel('عنوان الطلب', { exact: true }).fill(subject);
  await page
    .getByLabel('اشرح المشكلة', { exact: true })
    .fill('رسالة اختبار محلية خاصة موجهة إلى اتحاد الكلية فقط.');
  await page.getByRole('button', { name: 'إرسال تذكرة الدعم' }).click();
  await expect(page.locator('.form-success')).toContainText('وصل طلبك');
  await page.goto('/requests');
  await page.getByRole('heading', { name: subject, exact: true }).click();
  await expect(page).toHaveURL(/\/requests\//);
  const request = page.url();
  await logout(page);
  await login(page, 'union');
  await page.goto('/manage/support');
  await page.screenshot({ path: test.info().outputPath('support-unit-inbox.png'), fullPage: true });
  await page.getByRole('heading', { name: subject, exact: true }).click();
  await expect(page.getByRole('heading', { name: subject, exact: true })).toBeVisible();
  await page
    .getByLabel('ردك', { exact: true })
    .fill('رد اتحاد اختبار محلي، وصلت رسالتك إلى الجهة المختارة.');
  await page.getByRole('button', { name: 'إضافة رد', exact: true }).click();
  await expect(page.locator('.form-success')).toContainText('تمت إضافة');
  await logout(page);
  await login(page, 'demoadmin');
  await page.goto('/admin?tab=institutions');
  for (const title of [
    'محتوى جميع الأقسام',
    'سجل المؤسسات',
    'إدارة المجتمع الأكاديمي',
    'مساحة الطالب',
  ])
    await expect(
      page
        .getByRole('navigation', { name: 'إدارة المنصة' })
        .getByRole('link', { name: title, exact: true }),
    ).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'صندوق الواردات', exact: true })).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('admin-navigation-revised.png'),
    fullPage: true,
  });
  await page.goto('/manage/support');
  await expect(page.locator('.platform-console')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'صندوق الواردات', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'إدارة المنصة' })).toBeVisible();
  await expect(page.getByRole('heading', { name: subject, exact: true })).toHaveCount(0);
  await page.goto(request);
  await expect(page.getByRole('heading', { name: subject, exact: true })).toHaveCount(0);
});
test('forged recipient is rejected and pending student retains admin support only', async ({
  page,
}) => {
  await login(page, 'demostudent');
  await page.goto('/help');
  await page.locator('select[name=recipient]').evaluate((el: HTMLSelectElement) => {
    const o = document.createElement('option');
    o.value = 'other-institution:other-faculty:student_union:foreign';
    o.text = 'forged';
    el.append(o);
    el.value = o.value;
  });
  await page.getByLabel('عنوان الطلب', { exact: true }).fill('طلب اختبار رفض المستلم');
  await page
    .getByLabel('اشرح المشكلة', { exact: true })
    .fill('طلب محلي لاختبار رفض جهة لا تتبع كلية الطالب.');
  await page.getByRole('button', { name: 'إرسال تذكرة الدعم' }).click();
  await expect(page.locator('.form-error')).toContainText('تعذر إرسال الطلب');
  await logout(page);
  await login(page, 'pending');
  await page.goto('/help');
  await expect(page.locator('select[name=recipient] option')).not.toHaveCount(0);
  await expect(page.locator('select[name=recipient]')).toContainText('شؤون الطلاب');
  await expect(page.locator('select[name=recipient]')).not.toContainText('الجهة الأجنبية');
});
