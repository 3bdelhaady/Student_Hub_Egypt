import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('platform admin creates a separate pending agent login without a student identity or overwriting users', async ({
  page,
  browser,
}) => {
  test.setTimeout(80000);
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demoadmin.email);
  await page.locator('[name=password]').fill(accounts.demoadmin.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/admin/);
  await page.goto('/admin?tab=agents&new=1');
  const form = page.locator('form').filter({ has: page.locator('input[name=email]') });
  await form.locator('select[name=institutionId]').selectOption('demo-institution');
  await form.locator('select[name=department]').selectOption('student_affairs');
  await form.locator('select[name=facultyId]').selectOption('demo-computing');
  const email = `agent-onboarding-${Date.now()}@example.test`,
    password = randomBytes(24).toString('base64url');
  await form.locator('input[name=email]').fill(email);
  await form.getByLabel('إنشاء حساب دخول جديد للوكيل').check();
  await form.locator('input[name=displayName]').fill('وكيل شؤون طلاب اختبار محلي');
  await form.locator('input[name=newPassword]').fill(password);
  await form.locator('input[name=confirmPassword]').fill(password);
  await form.locator('input[name=canRead]').check();
  await form.getByRole('button', { name: 'إضافة الوكيل للمراجعة' }).click();
  await expect(form.getByRole('status')).toContainText('بانتظار تفعيل');
  await form.locator('select[name=institutionId]').selectOption('demo-institution');
  await form.locator('select[name=department]').selectOption('student_affairs');
  await form.locator('select[name=facultyId]').selectOption('demo-computing');
  await form.getByLabel('إنشاء حساب دخول جديد للوكيل').check();
  await form.locator('input[name=email]').fill(email);
  await form.locator('input[name=displayName]').fill('اسم بديل لا يجب أن يكتب فوق الحساب');
  await form.locator('input[name=newPassword]').fill(randomBytes(24).toString('base64url'));
  await form
    .locator('input[name=confirmPassword]')
    .fill(await form.locator('input[name=newPassword]').inputValue());
  await form.getByRole('button', { name: 'إضافة الوكيل للمراجعة' }).click();
  await expect(form.getByRole('alert')).toBeVisible();
  const ctx = await browser.newContext(),
    p = await ctx.newPage();
  await p.waitForTimeout(11000);
  await p.goto('/login');
  await p.locator('[name=email]').fill(email);
  await p.locator('[name=password]').fill(password);
  await p.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(p).toHaveURL(/\/agent$/);
  await expect(p.locator('main')).toContainText('بانتظار تفعيل أدمن المنصة');
  await p.goto('/courses');
  await expect(p).toHaveURL(/\/agent$/);
  await ctx.close();
});
