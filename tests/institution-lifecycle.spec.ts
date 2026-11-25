import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
const a = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('admin institution status toggles in its column while final column has details only', async ({
  page,
}) => {
  await page.goto('/login');
  await page.locator('[name=email]').fill(a.demoadmin.email);
  await page.locator('[name=password]').fill(a.demoadmin.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  const name = 'مؤسسة تحقق مؤقتة ' + Date.now();
  await page.goto('/admin?tab=institutions&new=1');
  await page.getByLabel('اسم المؤسسة', { exact: true }).fill(name);
  await page.getByLabel('نوع المؤسسة', { exact: true }).selectOption('private_sector');
  await page.getByRole('button', { name: 'حفظ المؤسسة', exact: true }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.goto('/admin?tab=institutions');
  const institutionHref = await page
    .locator('tbody tr')
    .filter({ hasText: name })
    .getByRole('link')
    .getAttribute('href');
  const institutionId = new URL(institutionHref!, 'http://localhost:3000').searchParams.get(
    'edit',
  )!;
  await page.goto('/admin?tab=agents&new=1');
  const form = page.locator('form').filter({ has: page.locator('input[name=email]') });
  await form.locator('[name=institutionId]').selectOption(institutionId);
  await form.locator('[name=department]').selectOption('private_sector');
  const email = 'lifecycle-' + Date.now() + '@example.test';
  const password = randomBytes(24).toString('base64url');
  await form.locator('[name=email]').fill(email);
  await form.getByLabel('إنشاء حساب دخول جديد للوكيل').check();
  await form.locator('[name=displayName]').fill('وكيل تحقق مؤقت');
  await form.locator('[name=newPassword]').fill(password);
  await form.locator('[name=confirmPassword]').fill(password);
  await form.getByRole('button', { name: 'إضافة الوكيل للمراجعة' }).click();
  await expect(form.getByRole('status')).toBeVisible();
  await page.goto('/admin?tab=agents');
  const agentRow = page.locator('tbody tr').filter({ hasText: email });
  await agentRow.getByRole('button', { name: 'تفعيل', exact: true }).click();
  await expect(agentRow.locator('.console-status')).toHaveText('مفعّل');
  await expect(page).toHaveURL(/admin\?tab=agents$/);
  await page.goto('/admin?tab=institutions');
  await page.getByPlaceholder('ابحث باسم المؤسسة...').fill(name);
  const row = page.locator('tbody tr').filter({ hasText: name });
  await row.getByRole('button', { name: 'تعطيل', exact: true }).click();
  await expect(row.locator('.console-status')).toHaveText('غير منشط');
  await expect(page).toHaveURL(/admin\?tab=institutions$/);
  await page.goto('/admin?tab=agents');
  await expect(agentRow.locator('.console-status')).toHaveText('موقوف');
  await agentRow.getByRole('button', { name: 'تفعيل', exact: true }).click();
  await expect(agentRow.getByRole('alert')).toBeVisible();
  await expect(agentRow.locator('.console-status')).toHaveText('موقوف');
  await page.goto('/admin?tab=institutions');
  await page.getByPlaceholder('ابحث باسم المؤسسة...').fill(name);
  await row.getByRole('button', { name: 'تنشيط', exact: true }).click();
  await expect(row.locator('.console-status')).toHaveText('منشط');
  await expect(row.locator('td').last().getByRole('button')).toHaveCount(0);
  await expect(row.locator('td').last().getByRole('link')).toHaveText('التفاصيل');
  await expect(
    row.locator('td').nth(3).getByRole('button', { name: 'تعطيل', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'إدارة بيانات المطاعم', exact: true })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: test.info().outputPath('institutions-status-desktop.png'),
    fullPage: true,
  });
  await row.getByRole('link').click();
  const lifecycle = page.locator('.institution-lifecycle');
  await lifecycle.getByRole('button', { name: 'حذف', exact: true }).click();
  await lifecycle.locator('[name=confirmation]').fill('اسم خاطئ');
  await lifecycle.getByRole('button', { name: 'تأكيد الحذف', exact: true }).click();
  await expect(lifecycle.getByRole('alert')).toBeVisible();
  await lifecycle.locator('[name=confirmation]').fill(name);
  await lifecycle.getByRole('button', { name: 'تأكيد الحذف', exact: true }).click();
  await expect(page.getByText('المؤسسة غير موجودة ضمن القائمة.', { exact: true })).toBeVisible();
  await page.goto('/admin?tab=institutions');
  await expect(row).toHaveCount(0);
  await page.goto('/admin?tab=agents');
  await expect(page.locator('tbody')).not.toContainText('Coordinator');
  await expect(page.locator('h1')).toHaveText('الوكلاء والصلاحيات');
  await page.goto('/admin?tab=students');
  await expect(page.locator('thead')).not.toContainText('تفاصيل');
  await expect(
    page
      .locator('tbody tr')
      .first()
      .getByRole('button', { name: /تفعيل|تعطيل/ }),
  ).toBeVisible();
  await page.goto('/admin?tab=organizations');
  await expect(page.locator('thead th').first()).toHaveText('الجامعة');
});
