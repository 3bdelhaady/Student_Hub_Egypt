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
  await expect(page).not.toHaveURL(/\/login$/);
}
test('student home connects requests, support and profile without mobile dead ends', async ({
  page,
}) => {
  await login(page, 'demostudent');
  await page.goto('/account?view=student');
  await expect(page.locator('.account-details-screen')).toBeVisible();
  await expect(page.locator('.student-overview')).toHaveCount(0);
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.locator('.profile-summary')).toBeVisible();
  await expect(page.getByRole('button', { name: 'تسجيل الخروج', exact: true })).toBeVisible();
  await page.goto('/help?topic=membership#contact');
  await expect(page.getByLabel('عنوان الطلب')).toHaveValue('طلب مراجعة بيانات الجامعة أو الكلية');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    await page.goto('/account?view=student');
    await expect(page.locator('.account-details-screen')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    const a = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(a.violations).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath(`journey-home-${width}.png`),
      fullPage: true,
    });
  }
});
test('saved housing stays visible across store search and filters', async ({ page }) => {
  test.setTimeout(95000);
  const title = 'سكن اختبار المحفوظات ' + Date.now();
  await login(page, 'demoadmin');
  await page.goto('/manage?new=1');
  await page.getByLabel('المؤسسة', { exact: true }).selectOption({ label: 'مصادر التعلم' });
  await page.locator('select[name=kind]').selectOption('housing');
  await page.getByLabel('العنوان', { exact: true }).fill(title);
  await page
    .getByLabel('الوصف والتفاصيل')
    .fill('اختبار محلي لمحفوظات السكن لا يمثل إعلان سكن حقيقي.');
  await page.getByLabel('منشور للطلاب داخل النطاق').check();
  await page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login(page, 'demostudent');
  await page.goto('/store?kind=housing');
  await page.getByRole('link', { name: title, exact: true }).click();
  await page.getByRole('button', { name: 'حفظ في قائمتي', exact: true }).click();
  await page.goto('/store?saved=1');
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'بحث', exact: true }).fill(title);
  await page.getByRole('button', { name: 'بحث', exact: true }).click();
  await expect(page).toHaveURL(/saved=1/);
  await page.locator('select[name=sort]').selectOption('price-asc');
  await page.getByRole('button', { name: 'تطبيق', exact: true }).click();
  await expect(page).toHaveURL(/saved=1/);
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'أقسام الصفحة' })
    .getByRole('link', { name: 'السكن الطلابي', exact: true })
    .click();
  await expect(page).toHaveURL(/saved=1/);
  await expect(page).toHaveURL(/kind=housing/);
  await expect(page.getByRole('textbox', { name: 'بحث', exact: true })).toHaveValue(title);
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'مسح البحث والتصفية' }).click();
  await expect(page).toHaveURL(/\/store$/);
});

test('login keeps the intended student destination and rejects external callbacks', async ({
  page,
}) => {
  test.setTimeout(70000);
  await page.goto('/notifications');
  await expect(page).toHaveURL(/\/login\?next=%2Fnotifications/);
  await expect(page.getByRole('link', { name: 'إنشاء حساب جديد', exact: true })).toHaveAttribute(
    'href',
    '/register?next=%2Fnotifications',
  );
  await page.waitForTimeout(11000);
  await page.locator('[name=email]').fill(accounts.demostudent.email);
  await page.locator('[name=password]').fill(accounts.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(page.getByRole('heading', { name: 'الإشعارات', exact: true })).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await page.goto('/login?next=https%3A%2F%2Fevil.example');
  await page.waitForTimeout(11000);
  await page.locator('[name=email]').fill(accounts.demostudent.email);
  await page.locator('[name=password]').fill(accounts.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/\/(account|courses\/[^/?]+)$/);
});
