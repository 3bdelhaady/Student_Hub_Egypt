import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('four store categories, ticket subtypes, retired links and distinct request tracking', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demostudent.email);
  await page.locator('[name=password]').fill(accounts.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/store?kind=trip');
  await expect(page).toHaveURL(/kind=ticket&ticketType=trip/);
  await expect(
    page.getByRole('link', { name: 'رحلة طلابية إلى الأقصر', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'تذكرة أمسية موسيقية', exact: true })).toHaveCount(0);
  await page.goto('/store?kind=ticket&ticketType=concert');
  await expect(page.getByRole('link', { name: 'تذكرة أمسية موسيقية', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'رحلة طلابية إلى الأقصر', exact: true })).toHaveCount(
    0,
  );
  await page.goto('/store?kind=training');
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole('heading', { name: 'دوراتك الخاصة', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'تدريب مهني', exact: true })).toHaveCount(0);
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 940 });
      for (const area of ['store', 'services']) {
        await page.goto('/' + area);
        const sidebar = page.locator('.academic-sidebar');
        await expect(sidebar.getByRole('link', { name: 'الرحلات', exact: true })).toHaveCount(0);
        await expect(
          sidebar.getByRole('link', { name: 'الدورات التدريبية', exact: true }),
        ).toHaveCount(0);
        await expect(sidebar.locator('.sidebar-request-tracking')).toHaveCount(1);
        const tracking = sidebar.locator('.sidebar-request-tracking');
        const bounds = await tracking.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        if (theme === 'dark')
          expect(await tracking.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
            'rgb(73, 58, 32)',
          );
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect(
          (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
            .violations,
        ).toEqual([]);
        await page.screenshot({
          path: test.info().outputPath(area + '-tracking-' + theme + '-' + width + '.png'),
          fullPage: true,
        });
      }
    }
  }
});
