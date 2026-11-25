import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: Page, key: string) {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
}
async function logout(page: Page) {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
}
test('union certificate additions and edits remain proposals until scoped affairs approval', async ({
  page,
}) => {
  test.setTimeout(210000);
  const title = 'شهادة مراجعة محلية ' + Date.now(),
    serial = 'CERT-REVIEW-' + Date.now();
  await login(page, 'union');
  await page.goto('/manage?kind=certificate&new=1');
  await expect(
    page.getByText('أي إضافة أو تعديل يرسل إلى شؤون الطلاب', { exact: false }),
  ).toHaveCount(0);
  await page.getByLabel('اسم صاحب الشهادة', { exact: true }).fill('طالب مراجعة محلي');
  await page.getByLabel('عنوان الشهادة', { exact: true }).fill(title);
  await page.getByLabel('تاريخ الإصدار', { exact: true }).fill('2026-11-23');
  await page.locator('input[name=serial]').fill(serial);
  await page.getByRole('button', { name: 'حفظ سجل الشهادة', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('لموافقة شؤون الطلاب');
  await logout(page);
  await login(page, 'demostudent');
  await page.goto('/services?kind=certificate');
  await page.locator('[name=serial]').fill(serial);
  await page.getByRole('button', { name: 'تحقق الآن من البيانات' }).click();
  await expect(page.locator('.form-error')).toContainText('لم نعثر');
  await logout(page);
  await login(page, 'otheraffairs');
  await page.goto('/manage/students');
  await expect(page.locator('.certificate-review-queue')).not.toContainText(title);
  await logout(page);
  await login(page, 'demoagent');
  await page.goto('/manage/students');
  const item = page.locator('.certificate-review-queue article').filter({ hasText: title });
  await expect(item).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('certificate-affairs-review.png'),
    fullPage: true,
  });
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 980 });
      await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
      await page.reload();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
      ).toEqual([]);
    }
  await item.getByLabel('راجعت بيانات الشهادة وأؤكد قراري').check();
  await item.getByRole('button', { name: 'موافقة وتوثيق الشهادة' }).click();
  await expect(page.locator('.certificate-review-queue')).not.toContainText(title);
  await logout(page);
  await login(page, 'union');
  await page.goto('/manage/certificates');
  const row = page.getByRole('row').filter({ hasText: serial });
  await expect(row).toContainText('متاح للتحقق');
  await row.getByRole('link').click();
  await page.getByLabel('عنوان الشهادة', { exact: true }).fill(title + ' تعديل');
  await page.getByRole('button', { name: 'حفظ سجل الشهادة', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('لموافقة شؤون الطلاب');
  await page.goto('/manage/certificates');
  await expect(page.getByRole('row').filter({ hasText: serial })).not.toContainText(
    title + ' تعديل',
  );
  await logout(page);
  await login(page, 'demostudent');
  await page.goto('/services?kind=certificate');
  await page.locator('[name=serial]').fill(serial);
  await page.getByRole('button', { name: 'تحقق الآن من البيانات' }).click();
  await expect(page.locator('.certificate-result')).toContainText(title);
  await expect(page.locator('.certificate-result')).not.toContainText(title + ' تعديل');
  await logout(page);
  await login(page, 'demoagent');
  await page.goto('/manage/students');
  const edit = page
    .locator('.certificate-review-queue article')
    .filter({ hasText: title + ' تعديل' });
  await expect(edit).toContainText('البيانات الحالية');
  await edit.getByLabel('راجعت بيانات الشهادة وأؤكد قراري').check();
  await edit.getByRole('button', { name: 'رفض التعديل' }).click();
  await expect(page.locator('.certificate-review-queue')).not.toContainText(title + ' تعديل');
});
