import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const account = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8')).demoagent;
test('student affairs has seven sidebar sections without a top navigation and retains scoped activation', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(account.email);
  await page.locator('[name=password]').fill(account.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 940 });
      await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
      await page.goto(width === 390 ? '/agent' : '/manage/students');
      await expect(page.locator('.affairs-workspace')).toHaveCount(1);
      await expect(page.locator('.workspace-header')).toHaveCount(0);
      await expect(page.locator('.affairs-sidebar nav a')).toHaveCount(7);
      for (const label of [
        'تفعيل حسابات الطلاب',
        'صلاحيات الاتحاد والأنشطة',
        'صندوق الواردات',
        'الملف الشخصي',
        'مساحة العمل الأكاديمية',
        'إدارة قنوات التواصل',
        'الدعم',
      ])
        await expect(
          page.locator('.affairs-sidebar').getByRole('link', { name: label, exact: true }),
        ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath('affairs-sidebar-' + theme + '-' + width + '.png'),
        fullPage: true,
      });
    }
  await page
    .locator('.affairs-sidebar')
    .getByRole('link', { name: 'صندوق الواردات', exact: true })
    .click();
  await expect(page).toHaveURL(/manage\/support/);
});
