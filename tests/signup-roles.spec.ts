import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('signup types have distinct scopes, pending agent activation and no Coordinator self-signup', async ({
  page,
  browser,
}) => {
  test.setTimeout(120000);
  for (const kind of ['student_affairs', 'private_sector']) {
    await page.waitForTimeout(11000);
    await page.goto('/register');
    const types = page.getByLabel('نوع الحساب', { exact: true });
    expect(
      await types
        .locator('option')
        .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value)),
    ).toEqual(['student_affairs', 'student', 'private_sector']);
    await types.selectOption(kind);
    if (kind === 'private_sector') {
      await expect(page.getByLabel('الجامعة', { exact: true })).toHaveCount(0);
      await expect(page.getByLabel('الكلية', { exact: true })).toHaveCount(0);
      await page.getByLabel('المؤسسة', { exact: true }).selectOption('demo-library');
    } else {
      await page.getByLabel('الجامعة', { exact: true }).selectOption('demo-university');
      await page.getByLabel('الكلية', { exact: true }).selectOption('demo-computing');
    }
    const email = `signup-${kind}-${Date.now()}@example.test`;
    const password = crypto.randomUUID() + 'Aa!';
    await page.locator('[name=name]').fill('طلب تفعيل اختبار محلي');
    await page.locator('[name=gender]').selectOption('male');
    await page.locator('[name=email]').fill(email);
    await page.locator('[name=password]').fill(password);
    await page.locator('[name=confirmPassword]').fill(password);
    await page.locator('input[type=checkbox]').check();
    await page.getByRole('button', { name: 'إنشاء حساب', exact: true }).click();
    await expect(page).toHaveURL(/\/agent$/);
    await expect(page.locator('main')).toContainText('بانتظار تفعيل أدمن المنصة');
    await expect(page.locator('#domain-content')).toHaveCount(0);
    await expect(page.locator('.mode-settings')).toHaveCount(0);
    await page.goto('/courses');
    await expect(page).toHaveURL(/\/agent$/);
    const ctx = await browser.newContext(),
      admin = await ctx.newPage();
    await admin.waitForTimeout(11000);
    await admin.goto('/login');
    await admin.locator('[name=email]').fill(accounts.demoadmin.email);
    await admin.locator('[name=password]').fill(accounts.demoadmin.password);
    await admin.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    await expect(admin).not.toHaveURL(/login/);
    await admin.goto('/admin?tab=agents');
    await expect(admin.locator('main')).toContainText(email);
    await ctx.close();
    await page.goto('/settings');
    await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  }
});
