import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: Page, email: string, password: string) {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(email);
  await page.locator('[name=password]').fill(password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
}
test('affairs activates only an existing same-faculty student with no automatic grants and profile mode switch', async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  const email = `officer-student-${Date.now()}@example.test`,
    password = crypto.randomUUID() + 'Aa!';
  await page.waitForTimeout(11000);
  await page.goto('/register');
  await page.getByLabel('اسمك', { exact: true }).fill('طالب وكيل اختبار محلي');
  await page.locator('[name=gender]').selectOption('male');
  await page.locator('[name=email]').fill(email);
  await page.locator('[name=password]').fill(password);
  await page.locator('[name=confirmPassword]').fill(password);
  await page.getByLabel('الجامعة', { exact: true }).selectOption('demo-university');
  await page.getByLabel('الكلية', { exact: true }).selectOption('demo-computing');
  await page.locator('input[type=checkbox]').check();
  await page.getByRole('button', { name: 'إنشاء حساب', exact: true }).click();
  await expect(page).not.toHaveURL(/register/);
  await page.goto('/profile');
  await expect(page.locator('.mode-settings')).toHaveCount(0);
  const ctx = await browser.newContext(),
    a = await ctx.newPage();
  await login(a, accounts.demoagent.email, accounts.demoagent.password);
  await a.goto('/manage/access');
  await a.getByRole('link', { name: 'منح صلاحية Coordinator', exact: true }).click();
  const form = a.locator('form').filter({ has: a.locator('[name=email]') });
  await expect(form.locator('[name=newPassword]')).toHaveCount(0);
  for (const rejected of [
    'nonexistent-' + email,
    accounts.outsider.email,
    accounts.editor.email,
    accounts.union.email,
  ]) {
    await form.locator('[name=email]').fill(rejected);
    await form.locator('[name=organizationId]').selectOption('demo-union-computing');
    const response = a.waitForResponse(
      (r) => r.request().method() === 'POST' && !!r.request().headers()['next-action'],
    );
    await Promise.all([
      a.waitForResponse(
        (r) => r.request().method() === 'POST' && !!r.request().headers()['next-action'],
      ),
      form.getByRole('button', { name: 'تفعيل صلاحية Coordinator', exact: true }).click(),
    ]);
    await response;
    await expect(form.getByRole('alert')).toBeVisible();
  }
  await form.locator('[name=email]').fill(email);
  await form.locator('[name=organizationId]').selectOption('demo-activity-computing');
  await a.route('**/manage/access*', async (route) => {
    const data = route.request().postData();
    return route.continue(
      route.request().method() === 'POST' && data?.includes('organizationId')
        ? { postData: data.replaceAll('demo-activity-computing', 'nonexistent-foreign-body') }
        : {},
    );
  });
  await Promise.all([
    a.waitForResponse(
      (r) => r.request().method() === 'POST' && !!r.request().headers()['next-action'],
    ),
    form.getByRole('button', { name: 'تفعيل صلاحية Coordinator', exact: true }).click(),
  ]);
  await expect(form.getByRole('alert')).toBeVisible();
  await a.unroute('**/manage/access*');
  await form.locator('[name=email]').fill(email);
  await form.locator('[name=organizationId]').selectOption('demo-activity-computing');
  await Promise.all([
    a.waitForResponse(
      (r) => r.request().method() === 'POST' && !!r.request().headers()['next-action'],
    ),
    form.getByRole('button', { name: 'تفعيل صلاحية Coordinator', exact: true }).click(),
  ]);
  await expect(form.getByRole('status')).toContainText('تم تفعيل صلاحية Coordinator');
  await a.reload();
  const card = a.locator('article').filter({ hasText: email });
  await expect(card).toContainText('مفعّل');
  await expect(card.locator('input[type=checkbox]:checked')).toHaveCount(0);
  await a.screenshot({
    path: test.info().outputPath('affairs-new-officer-card.png'),
    fullPage: true,
  });
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await a.setViewportSize({ width, height: 980 });
      await a.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
      await a.reload();
      expect(await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(
        (await new AxeBuilder({ page: a }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
      ).toEqual([]);
    }
  await page.goto('/profile');
  await expect(page.locator('.mode-settings')).toBeVisible();
  await expect(page.locator('[name=mode][value=student]')).toBeChecked();
  await page.locator('[name=mode][value=agent]').check();
  await page.getByRole('button', { name: 'حفظ نوع الحساب', exact: true }).click();
  await expect(page).toHaveURL(/manage$/);
  await expect(page.getByRole('link', { name: 'الشهادات والإيفادات', exact: true })).toHaveCount(0);
  await page.goto('/manage?kind=certificate');
  await expect(page.getByRole('heading', { name: 'سجل الشهادات', exact: true })).toHaveCount(0);
  await page.goto('/profile');
  await expect(page.locator('[name=mode][value=agent]')).toBeChecked();
  await page.screenshot({
    path: test.info().outputPath('officer-profile-mode.png'),
    fullPage: true,
  });
  await page.locator('[name=mode][value=student]').check();
  await page.getByRole('button', { name: 'حفظ نوع الحساب', exact: true }).click();
  await expect(page).toHaveURL(/account\?view=student/);
  await expect(page.locator('main')).toContainText('قيد المراجعة');
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login(page, email, password);
  await page.goto('/profile');
  await expect(page.locator('[name=mode][value=student]')).toBeChecked();
  await ctx.close();
});
