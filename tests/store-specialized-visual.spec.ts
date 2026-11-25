import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const a = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8')).demostudent;
test('housing and restaurant surfaces stay readable in both themes', async ({ page }) => {
  test.setTimeout(110000);
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(a.email);
  await page.locator('[name=password]').fill(a.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['/store?kind=housing', '/store?kind=restaurant']) {
        await page.goto(route);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        expect(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        ).toEqual([]);
        await page.screenshot({
          path: test
            .info()
            .outputPath(
              `${theme}-${width}-${route.includes('housing') ? 'housing' : 'restaurant'}.png`,
            ),
          fullPage: true,
        });
      }
    }
  }
});
