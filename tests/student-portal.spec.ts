import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
test.use({ actionTimeout: 10000 });
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: import('@playwright/test').Page, key: string) {
  await new Promise((r) => setTimeout(r, 11000));
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}
async function logout(page: import('@playwright/test').Page) {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await expect(page).toHaveURL(/login/);
}
test('Manual commerce, scoped management, support, private request threads and notifications', async ({
  page,
}) => {
  test.setTimeout(95000);
  const product = 'أداة دراسية للاختبار ' + Date.now();
  await login(page, 'demoadmin');
  await page.goto('/manage?new=1');
  await page.getByLabel('المؤسسة', { exact: true }).selectOption({ label: 'مصادر التعلم' });
  await page.getByLabel('العنوان', { exact: true }).fill(product);
  await page
    .getByLabel('الوصف والتفاصيل')
    .fill('وصف منتج اختبار محلي حقيقي في قاعدة البيانات لاختبار الطلب اليدوي دون دفع.');
  await page.getByLabel('السعر بالجنيه المصري').fill('150');
  await page.getByLabel('السعة المتاحة، اتركها فارغة إن لم تنطبق').fill('3');
  await page.getByLabel('منشور للطلاب داخل النطاق').check();
  await page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await logout(page);
  await login(page, 'demostudent');
  await page.goto('/store');
  await page.getByRole('link', { name: product, exact: true }).click();
  await page.getByRole('link', { name: 'دفع وإتمام عملية الشراء', exact: true }).click();
  await page.getByRole('button', { name: 'دفع وإتمام عملية الشراء', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'لديك طلب قائم', exact: true })).toBeVisible();
  await page.goto('/store');
  await page.getByRole('link', { name: product, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'لديك طلب قيد المتابعة' })).toBeVisible();
  await page.reload();
  await page.screenshot({
    path: test.info().outputPath('student-active-request.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'متابعة هذا الطلب', exact: true }).click();
  await expect(page).toHaveURL(/\/requests\/[^/]+$/);
  await page.goto('/requests');
  await page.getByRole('heading', { name: product, exact: true }).click();
  await expect(page).toHaveURL(/\/requests\/[^/]+$/);
  const requestUrl = page.url();
  await page.getByLabel('ردك', { exact: true }).fill('أرجو إبلاغي بموعد الاستلام المتاح.');
  await page.getByRole('button', { name: 'إضافة رد', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'إضافة الرد' })).toBeVisible();
  await page.goto('/help');
  await page.getByLabel('عنوان الطلب').fill('مراجعة بيانات العضوية');
  await page
    .getByLabel('اشرح المشكلة')
    .fill('هذه تذكرة دعم اختبار محلية للتأكد من وصول المشكلة لإدارة المنصة.');
  await page.getByRole('button', { name: 'إرسال تذكرة الدعم' }).click();
  await expect(page.getByRole('status')).toContainText('وصل طلبك');
  await page.setViewportSize({ width: 1280, height: 940 });
  await logout(page);
  await login(page, 'outsider');
  await page.goto(requestUrl);
  await expect(page.getByText('أرجو إبلاغي بموعد الاستلام المتاح.', { exact: true })).toHaveCount(
    0,
  );
  await logout(page);
  await login(page, 'demoadmin');
  await page.goto(requestUrl);
  await page.getByLabel('الحالة الجديدة').selectOption('accepted');
  await page.getByRole('button', { name: 'تحديث الحالة' }).click();
  await expect(page.getByRole('status')).toContainText('تم تحديث');
  await page
    .getByLabel('ردك', { exact: true })
    .fill('تم تأكيد الطلب يدويًا، يرجى متابعة تفاصيل الاستلام هنا.');
  await page.getByRole('button', { name: 'إضافة رد', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'إضافة الرد' })).toBeVisible();
  await logout(page);
  await login(page, 'demostudent');
  await page.goto('/notifications');
  await expect(page.getByRole('heading', { name: 'رد جديد على طلبك' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'تحديد الكل كمقروء' }).click();
  await expect(page.locator('.notification-list .unread')).toHaveCount(0);
});

test('Student portal visual and accessibility coverage', async ({ page }) => {
  test.setTimeout(95000);
  await login(page, 'demostudent');
  const accessibility: unknown[] = [];
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    for (const route of [
      '/store',
      '/services',
      '/profile',
      '/requests',
      '/notifications',
      '/help',
      '/community',
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({
        path: test.info().outputPath(`hub-portal-${route.slice(1)}-${width}.png`),
        fullPage: true,
      });
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      if (result.violations.length)
        accessibility.push({
          route,
          width,
          issues: result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        });
    }
  }
  expect(accessibility).toEqual([]);
});

test('appearance preference saves on this device and can return to light mode', async ({
  page,
}) => {
  test.setTimeout(60000);
  await login(page, 'demostudent');
  await page.goto('/settings');
  await page.getByLabel('الوضع الداكن', { exact: true }).check();
  await page.getByRole('button', { name: 'حفظ التفضيلات', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({
    path: test.info().outputPath('hub-portal-settings-dark-1280.png'),
    fullPage: true,
  });
  await page.getByLabel('الوضع الفاتح', { exact: true }).check();
  await page.getByRole('button', { name: 'حفظ التفضيلات', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({
    path: test.info().outputPath('hub-portal-settings-light-1280.png'),
    fullPage: true,
  });
});
