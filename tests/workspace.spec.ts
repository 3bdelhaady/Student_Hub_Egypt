import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: import('@playwright/test').Page, role = 'student') {
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني الجامعي', { exact: true }).fill(accounts[role].email);
  await page.locator('input[name=password]').fill(accounts[role].password);
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = page.waitForResponse(
      (r) => r.url().includes('/api/auth/sign-in/email') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    const result = await response;
    if (result.status() !== 429) {
      expect(result.status(), 'login response').toBe(200);
      break;
    }
    const retry = Math.max(11, Number(result.headers()['retry-after']) || 11);
    await page.waitForTimeout(retry * 1000);
  }
  await expect(page).toHaveURL(/\/(account|courses\/[^/?]+|admin\?tab=institutions)$/);
}
test.beforeEach(async () => {
  await new Promise((r) => setTimeout(r, 11000));
});
test('saved courses and learning progress persist and can be undone', async ({ page }) => {
  await login(page);
  await page.goto('/courses/math-2');
  const remove = page.getByRole('button', { name: 'إزالة من المحفوظات', exact: true });
  if (await remove.count()) {
    await remove.click();
    await expect(page.getByRole('button', { name: 'حفظ المقرر', exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'حفظ المقرر', exact: true }).click();
  await expect(remove).toBeVisible();
  await page.reload();
  await expect(remove).toBeVisible();
  await page.goto('/courses?view=manage');
  await expect(page.locator('[data-course-id=math-2]')).toBeChecked();
  await page.goto('/courses/math-2');
  const total = await page.locator('details.resource').count();
  const resource = page.locator('details.resource').first();
  await resource.locator('summary').click();
  const undo = resource.getByRole('button', { name: 'مكتمل، التراجع عن الإكمال', exact: true });
  if (await undo.count()) {
    await undo.click();
    await expect(resource.getByRole('button', { name: 'تحديد كمكتمل', exact: true })).toBeVisible();
  }
  await resource.getByRole('button', { name: 'تحديد كمكتمل', exact: true }).click();
  await expect(undo).toBeVisible();
  await expect(page.getByText(`1 من ${total} موارد مكتملة`)).toBeVisible();
  await page.reload();
  await expect(page.getByText(`1 من ${total} موارد مكتملة`)).toBeVisible();
  await resource.locator('summary').click();
  await undo.click();
  await expect(page.getByText(`0 من ${total} موارد مكتملة`)).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('hub-learning-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: test.info().outputPath('hub-learning-mobile.png'),
    fullPage: true,
  });
  await page.goto('/courses?view=manage');
  await page.locator('[data-course-id=math-2]').uncheck();
  await page.getByRole('button', { name: 'حفظ التعديلات', exact: true }).click();
  await page.reload();
  await expect(page.locator('[data-course-id=math-2]')).not.toBeChecked();
});
test('faculty catalog is admin-managed, scoped and supports unavailable faculties', async ({
  page,
}) => {
  await login(page, 'admin');
  await page.goto('/admin?tab=faculties&new=1');
  const name = `كلية تجربة ${Date.now()}`;
  await page.getByLabel('اسم الكلية', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'حفظ التغييرات', exact: true }).click();
  await expect(page.getByText('تم حفظ الكلية،', { exact: false })).toBeVisible();
  await page.goto('/admin?tab=faculties');
  const row = page.getByRole('row').filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: 'تعديل' }).click();
  await page.getByRole('checkbox', { name: 'متاحة لطلبات الانضمام الجديدة' }).uncheck();
  await page.getByRole('button', { name: 'حفظ التغييرات', exact: true }).click();
  await expect(page.getByText('تم حفظ الكلية،', { exact: false })).toBeVisible();
  await page.goto('/register');
  await page.getByLabel('الجامعة', { exact: true }).selectOption('demo-university');
  await expect(
    page.getByLabel('الكلية', { exact: true }).locator('option').filter({ hasText: name }),
  ).toHaveCount(0);
  await page.goto('/admin?tab=faculties');
  await page.screenshot({ path: test.info().outputPath('hub-faculty-admin.png'), fullPage: true });
});
test('faculty selection resets when university changes', async ({ page }) => {
  await page.goto('/register');
  const u = page.getByLabel('الجامعة', { exact: true });
  const f = page.getByLabel('الكلية', { exact: true });
  await expect(f).toBeDisabled();
  await u.selectOption('demo-university');
  await f.selectOption('demo-computing');
  await u.selectOption('other-university');
  await expect(f).toHaveValue('');
  await expect(f).toBeDisabled();
  await expect(page.getByText('لا توجد خيارات متاحة لهذا النطاق،', { exact: false })).toBeVisible();
});
