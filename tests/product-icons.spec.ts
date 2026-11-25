import { test, expect } from '@playwright/test';
test('academic products have product icons and no demo banner', async ({ page }) => {
  await page.goto('/store');
  await expect(page.locator('.review-demo-notice')).toHaveCount(0);
  const cards = page.locator('.portal-card');
  if (await cards.count())
    await expect(cards.first().locator('img,.product-item-icon')).toHaveCount(1);
  await page.screenshot({
    path: test.info().outputPath('academic-product-icons.png'),
    fullPage: true,
  });
});
