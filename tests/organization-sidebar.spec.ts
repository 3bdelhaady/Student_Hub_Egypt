import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('union agent uses a scoped sidebar without inheriting affairs powers', async ({ page }) => {
  test.setTimeout(110000);
  for (const key of ['union']) {
    await page.waitForTimeout(11000);
    await page.goto('/login');
    await page.locator('[name=email]').fill(accounts[key].email);
    await page.locator('[name=password]').fill(accounts[key].password);
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    await expect(page).not.toHaveURL(/login/);
    for (const theme of ['light', 'dark'])
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 940 });
        await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
        await page.goto('/manage/support');
        await expect(page.locator('.affairs-sidebar')).toBeVisible();
        await expect(page.locator('.workspace-header')).toHaveCount(0);
        await expect(
          page.locator('.affairs-sidebar').getByRole('link', { name: 'لوحة التحكم', exact: true }),
        ).toHaveCount(1);
        await expect(
          page.locator('.affairs-sidebar').getByRole('link', { name: 'لوحتي', exact: true }),
        ).toHaveCount(0);
        await expect(
          page
            .locator('.affairs-sidebar')
            .getByRole('link', { name: 'الخدمات والطلبات', exact: true }),
        ).toHaveCount(0);
        await expect(
          page
            .locator('.affairs-sidebar')
            .getByRole('link', { name: 'صندوق الواردات', exact: true }),
        ).toBeVisible();
        await expect(page.getByText('رسائل الجهة', { exact: true })).toHaveCount(0);
        await expect(page.locator('.affairs-sidebar a[href="/manage/students"]')).toHaveCount(0);
        await expect(page.locator('.affairs-sidebar a[href="/manage/access"]')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect(
          (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
        ).toEqual([]);
        await page.screenshot({
          path: test.info().outputPath(`${key}-sidebar-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 940 });
      await page.goto('/agent');
      await expect(page).toHaveURL(/manage/);
      await expect(page.locator('.workspace-header')).toHaveCount(0);
      await expect(
        page.locator('.affairs-sidebar').getByRole('link', { name: 'لوحة التحكم', exact: true }),
      ).toHaveCount(1);
      await expect(
        page.locator('.affairs-sidebar').getByRole('link', { name: 'لوحتي', exact: true }),
      ).toHaveCount(0);
      await expect(
        page
          .locator('.affairs-sidebar')
          .getByRole('link', { name: 'الخدمات والطلبات', exact: true }),
      ).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: test.info().outputPath(`union-dashboard-${width}.png`),
        fullPage: true,
      });
    }
    await page.goto('/settings');
    await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  }
});
