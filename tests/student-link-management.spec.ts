import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('Student Link exposes typed opportunity forms and each opportunity opens its own applicants', async ({
  page,
}, info) => {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.union.email);
  await page.locator('[name=password]').fill(accounts.union.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/manage?kind=service');
  for (const label of [
    'عرض العناصر',
    'إضافة عنصر جديد',
    'طلبات التسجيل والانضمام',
    '+ إضافة خدمة أو منتج',
  ])
    await expect(page.getByRole('link', { name: label, exact: true })).toHaveCount(0);
  for (const [kind, label] of [
    ['internship', 'إضافة فرصة تدريب'],
    ['scholarship', 'إضافة منحة'],
    ['job', 'إضافة فرصة عمل'],
  ]) {
    await page.getByRole('link', { name: label, exact: true }).click();
    await expect(page.locator('[name=opportunityType]')).toHaveValue(kind);
    await page.goto('/manage?kind=service');
  }
  await page.getByRole('link', { name: 'إضافة فرصة تدريب', exact: true }).click();
  const title = 'فرصة تدريب للاختبار ' + Date.now();
  await page.locator('[name=title]').fill(title);
  await page
    .locator('textarea[name=description]')
    .fill('بيانات فرصة تدريب داخلية في الاختبار فقط للتحقق من متابعة المتقدمين.');
  await page.getByRole('button', { name: 'حفظ كمسودة', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/manage?kind=service');
  await page.getByRole('link', { name: title, exact: true }).click();
  await expect(page).toHaveURL(/kind=service&tab=requests&entry=/);
  await expect(
    page.getByRole('heading', { name: 'لم يتقدم طلاب لهذه الفرصة بعد', exact: true }),
  ).toBeVisible();
  await page.goto('/manage?kind=service');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 960 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath('student-link-management-' + width + '.png'),
      fullPage: true,
    });
  }
});
test('poll management adds a poll and opens private aggregate results without application controls', async ({
  page,
}, info) => {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.union.email);
  await page.locator('[name=password]').fill(accounts.union.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/manage?kind=poll');
  for (const label of [
    'عرض العناصر',
    'إضافة عنصر جديد',
    'طلبات التسجيل والانضمام',
    '+ إضافة خدمة أو منتج',
  ])
    await expect(page.getByRole('link', { name: label, exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'إضافة تصويت أو استبيان', exact: true }).click();
  const title = 'تصويت للمراجعة ' + Date.now();
  await page.locator('[name=title]').fill(title);
  for (const field of [
    'description',
    'category',
    'price',
    'capacity',
    'imageUrl',
    'location',
    'startsAt',
    'closesAt',
  ])
    await expect(page.locator('form [name=' + field + ']')).toHaveCount(0);
  await expect(page.locator('input[name=pollOption]')).toHaveCount(1);
  await page.getByLabel('الخيار 1', { exact: true }).fill('الصباح');
  await page.getByRole('button', { name: 'إضافة خيار', exact: true }).click();
  await page.getByLabel('الخيار 2', { exact: true }).fill('المساء');
  for (let n = 3; n <= 5; n++) {
    await page.getByRole('button', { name: 'إضافة خيار', exact: true }).click();
    await page.getByLabel('الخيار ' + n, { exact: true }).fill('اختيار ' + n);
  }
  await expect(page.locator('input[name=pollOption]')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'إضافة خيار', exact: true })).toBeDisabled();
  await page.locator('[name=pollAudience]').selectOption('university');
  await page.getByRole('button', { name: 'حفظ كمسودة', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/manage?kind=poll');
  await page.getByRole('link', { name: title, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'نتائج التصويت', exact: true })).toBeVisible();
  await expect(page.getByText('إجمالي الأصوات: 0', { exact: true })).toBeVisible();
  await expect(page.getByText('الصباح', { exact: true })).toBeVisible();
  await expect(page.getByText('المساء', { exact: true })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(accounts.demostudent.email);
  await page.screenshot({ path: info.outputPath('poll-management-results.png'), fullPage: true });
});
