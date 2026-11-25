import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const account = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8')).demostudent;
test('academic store cover remains readable without invented inventory and links to the actual catalog', async ({
  page,
}) => {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(account.email);
  await page.locator('[name=password]').fill(account.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('hub-theme', value), theme);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 940 });
      await page.goto('/store');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('.portal-product-hero-art')).toHaveJSProperty('complete', true);
      await expect
        .poll(() =>
          page
            .locator('.portal-product-hero-art')
            .evaluate((e: HTMLImageElement) => e.naturalWidth),
        )
        .toBeGreaterThan(0);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.mouse.move(0, 0);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          document
            .getAnimations()
            .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => {})),
        );
      });
      const samples = await page.evaluate((originalTheme) => {
        const button = document.querySelector('.portal-toolbar a[href="/store?saved=1"]')!;
        const results = [];
        for (const nextTheme of ['light', 'dark']) {
          document.documentElement.dataset.theme = nextTheme;
          const styles = getComputedStyle(button);
          results.push({ background: styles.backgroundColor, color: styles.color });
        }
        document.documentElement.dataset.theme = originalTheme;
        return results;
      }, theme);
      expect(samples).toEqual([
        { background: 'rgb(255, 255, 255)', color: 'rgb(32, 40, 46)' },
        { background: 'rgb(33, 59, 73)', color: 'rgb(226, 240, 243)' },
      ]);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath(`store-cover-${theme}-${width}.png`),
        fullPage: true,
      });
      await page.getByRole('link', { name: 'تصفح المنتجات', exact: true }).click();
      await expect(page).toHaveURL(/#portal-catalog$/);
      await expect(page.locator('#portal-catalog')).toBeInViewport();
    }
  }
});
