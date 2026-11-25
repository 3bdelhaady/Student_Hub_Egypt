import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8')).demostudent;
test('student card has zero balance, disabled top-up, honest history and no auto renewal', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/card');
  await expect(page).toHaveURL(/login/);
  await page.waitForTimeout(11000);
  await page.locator('[name=email]').fill(a.email);
  await page.locator('[name=password]').fill(a.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/profile');
  await page.getByRole('link', { name: 'الرصيد والمعاملات والاشتراكات', exact: true }).click();
  await expect(page).toHaveURL(/\/card$/);
  await expect(page.getByRole('button', { name: 'شحن رصيد', exact: true })).toBeDisabled();
  await expect(page.getByText('٠٫٠٠ ج.م.', { exact: true })).toBeVisible();
  await expect(
    page.getByText('لا توجد معاملات على الكرت حتى الآن.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('لا توجد اشتراكات مرتبطة بالكرت حاليًا.', { exact: true }),
  ).toBeVisible();
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath(`card-${theme}-${width}.png`),
        fullPage: true,
      });
    }
});
