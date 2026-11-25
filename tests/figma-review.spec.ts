import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
// Respect the authentication rate limit across adjacent browser suites.
test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 11000));
});
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('Figma auth and admin visual review', async ({ page }) => {
  test.setTimeout(180000);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    for (const route of ['login', 'register']) {
      await page.goto('/' + route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('.site-header')).toBeHidden();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({
        path: test.info().outputPath(`hub-figma-${route}-${width}.png`),
        fullPage: true,
      });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      ).toEqual([]);
    }
  }
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demoadmin.email);
  await page.locator('[name=password]').fill(accounts.demoadmin.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/admin/);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    for (const tab of ['institutions', 'agents', 'students', 'institutions&new=1']) {
      await page.goto('/admin?tab=' + tab);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('.platform-console')).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({
        path: test.info().outputPath(`hub-figma-admin-${tab.replace('&', '-')}-${width}.png`),
        fullPage: true,
      });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      ).toEqual([]);
    }
  }
  await page.goto('/admin?tab=agents');
  await page.getByPlaceholder('ابحث بالاسم أو البريد...').fill('no-such-person');
  await expect(page.getByText('لا توجد نتائج مطابقة،', { exact: false })).toBeVisible();
  await page.getByPlaceholder('ابحث بالاسم أو البريد...').fill(accounts.pendingagent.email);
  await page.locator('tbody tr').getByRole('link').click();
  await expect(page.locator('.console-agent-detail')).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('hub-figma-agent-detail-mobile.png'),
    fullPage: true,
  });
});
