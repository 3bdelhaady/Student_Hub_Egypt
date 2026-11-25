import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('admin inbox uses the same console as admin directories at all widths and themes', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demoadmin.email);
  await page.locator('[name=password]').fill(accounts.demoadmin.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/admin?tab=institutions');
  await page
    .getByRole('navigation', { name: 'إدارة المنصة' })
    .getByRole('link', { name: 'صندوق الواردات', exact: true })
    .click();
  await expect(page).toHaveURL(/manage\/support/);
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 940 });
      await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
      await page.reload();
      await expect(page.locator('.platform-console')).toHaveCount(1);
      await expect(page.locator('.console-header h1')).toHaveText('صندوق الواردات');
      await expect(page.getByRole('navigation', { name: 'إدارة المنصة' })).toBeVisible();
      await expect(page.getByText('الطلبات والدعم', { exact: true })).toHaveCount(0);
      await expect(page.getByLabel('بحث في الرسائل')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath(`admin-inbox-${theme}-${width}.png`),
        fullPage: true,
      });
    }
  await page
    .getByRole('navigation', { name: 'إدارة المنصة' })
    .getByRole('link', { name: 'المؤسسات', exact: true })
    .click();
  await expect(page).toHaveURL(/admin\?tab=institutions/);
  await expect(page.locator('.platform-console')).toBeVisible();
});
