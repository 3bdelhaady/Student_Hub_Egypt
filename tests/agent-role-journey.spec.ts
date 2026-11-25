import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(p: Page, key: string) {
  await p.waitForTimeout(11000);
  await p.goto('/login');
  await p.locator('[name=email]').fill(accounts[key].email);
  await p.locator('[name=password]').fill(accounts[key].password);
  await p.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(p).not.toHaveURL(/login/);
}
test('affairs manages own-faculty officer permissions and never service publishing', async ({
  browser,
}) => {
  test.setTimeout(95000);
  const ctx = await browser.newContext(),
    page = await ctx.newPage();
  await login(page, 'demoagent');
  await page.goto('/agent');
  await expect(
    page.getByRole('link', { name: 'صلاحيات الاتحاد والأنشطة', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'الخدمات والطلبات', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'صلاحيات الاتحاد والأنشطة', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'صلاحيات اتحاد وأنشطة الكلية' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(accounts.otheraffairs.email);
  const officer = page.locator('article').filter({ hasText: accounts.union.email });
  await expect(officer).toBeVisible();
  await expect(officer.locator('select[name=status]')).toHaveCount(0);
  const publish = officer.locator('input[name="ticket.canPublish"]');
  const original = await publish.isChecked();
  await publish.uncheck();
  await officer.getByRole('button', { name: 'تأكيد الصلاحيات' }).click();
  await expect(officer.getByRole('status')).toBeVisible();
  await page.reload();
  await expect(officer.locator('input[name="ticket.canPublish"]')).not.toBeChecked();
  if (original) {
    await officer.locator('input[name="ticket.canPublish"]').check();
    await officer.getByRole('button', { name: 'تأكيد الصلاحيات' }).click();
    await expect(officer.getByRole('status')).toBeVisible();
  }
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    await page.screenshot({
      path: test.info().outputPath(`affairs-access-${width}.png`),
      fullPage: true,
    });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
  }
  await page.goto('/manage?new=1');
  await expect(page.getByRole('heading', { name: 'إضافة خدمة أو منتج' })).toHaveCount(0);
  await ctx.close();
  const uc = await browser.newContext(),
    up = await uc.newPage();
  await login(up, 'union');
  await up.goto('/settings');
  await expect(up).toHaveURL(/\/profile$/);
  await expect(up.getByRole('heading', { name: 'الملف الشخصي', exact: true })).toBeVisible();
  if (await up.locator('[value=agent]').count()) {
    await up.locator('[value=agent]').check();
    await up.getByRole('button', { name: 'حفظ نوع الحساب' }).click();
    await expect(up).toHaveURL(/\/manage$/);
  }
  await up.goto('/agent');
  await expect(up).toHaveURL(/\/manage$/);
  for (const title of [
    'التذاكر الإلكترونية',
    'الفرق الأكاديمية',
    'التطوع والأنشطة',
    'الشهادات والإيفادات',
    'رابط الطلاب',
    'التصويت والاستبيانات',
  ])
    await expect(
      up
        .getByRole('navigation', { name: 'أقسام الخدمات للإدارة' })
        .getByRole('link', { name: title, exact: true }),
    ).toBeVisible();
  for (const title of ['الرحلات', 'الدورات التدريبية'])
    await expect(
      up
        .getByRole('navigation', { name: 'أقسام الخدمات للإدارة' })
        .getByRole('link', { name: title, exact: true }),
    ).toHaveCount(0);
  for (const width of [1280, 390]) {
    await up.setViewportSize({ width, height: 940 });
    await up.screenshot({
      path: test.info().outputPath(`union-services-${width}.png`),
      fullPage: true,
    });
    await expect
      .poll(() => up.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    const a = await new AxeBuilder({ page: up })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(a.violations).toEqual([]);
  }
  for (const route of [
    '/courses',
    '/courses/math-2',
    '/store',
    '/store?saved=1',
    '/services',
    '/community',
    '/account?view=student',
    '/',
  ]) {
    await up.goto(route);
    await expect(up).toHaveURL(/\/manage$/);
    await expect(up.locator('.student-workspace')).toHaveCount(0);
    await expect(up.locator('.affairs-workspace')).toBeVisible();
  }
  await up.goto('/profile');
  await expect(up).toHaveURL(/\/profile$/);
  await expect(up.locator('.mode-settings')).toBeVisible();
  await expect(up.locator('[name=mode][value=agent]')).toBeChecked();
  await up.goto('/manage/access');
  await expect(up.getByRole('heading', { name: 'صلاحيات اتحاد وأنشطة الكلية' })).toHaveCount(0);
  await uc.close();
});

test('only assigned service agents can publish, affairs replay and forged group fail', async ({
  browser,
}) => {
  test.setTimeout(80000);
  const uc = await browser.newContext(),
    up = await uc.newPage();
  await login(up, 'union');
  await up.goto('/manage?new=1');
  await expect(up.locator('input[name=department]')).toHaveValue('student_union');
  await expect(up.locator('input[name=facultyId]')).toHaveValue('demo-computing');
  await expect(up.locator('input[name=organizationId]')).toHaveValue('demo-union-computing');
  await up.locator('[name=title]').fill('خدمة اتحاد للاختبار ' + Date.now());
  await up
    .locator('textarea[name=description]')
    .fill('وصف اختبار محلي للخدمة داخل نطاق الاتحاد لا يظهر في الإنتاج.');
  await up.locator('[name=published]').check();
  const req = up.waitForRequest((r) => r.method() === 'POST' && !!r.headers()['next-action']);
  await up.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  const captured = await req;
  await expect(up.getByRole('status')).toContainText('تم حفظ');
  const ac = await browser.newContext(),
    ap = await ac.newPage();
  await login(ap, 'demoagent');
  const headers = {
    'next-action': captured.headers()['next-action'],
    'content-type': captured.headers()['content-type'],
    origin: 'http://localhost:3000',
  };
  const denied = await ac.request.post(captured.url(), {
    headers,
    data: captured.postDataBuffer()!,
  });
  expect(await denied.text()).toContain('تعذر');
  const forged = await uc.request.post(captured.url(), {
    headers,
    data: captured.postData()!.replaceAll('demo-union-computing', 'forged-other-group'),
  });
  expect(await forged.text()).toContain('تعذر');
  await uc.close();
  await ac.close();
});
