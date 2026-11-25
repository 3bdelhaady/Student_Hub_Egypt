import { test, expect } from '@playwright/test';
test('fitness consent is explicit and missing configuration fails closed', async ({ page }) => {
  await page.goto('/fitness/connect?state=valid_state_123456789012345');
  await expect(page.getByRole('heading', { name: 'ربط حسابك بتطبيق Fitness Club' })).toBeVisible();
  await page.getByRole('button', { name: 'متابعة إلى Fitness Club' }).click();
  await expect(page.getByText('تعذر إنشاء رمز الربط، حاول مرة أخرى.')).toBeVisible();
  await expect(page).toHaveURL(/\/fitness\/connect/);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    await page.screenshot({
      path: test.info().outputPath(`hub-fitness-connect-${width}.png`),
      fullPage: true,
    });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
  }
  await page.goto('/fitness/connect?return=https://untrusted.example/callback');
  await expect(page.getByRole('button', { name: 'متابعة إلى Fitness Club' })).toBeDisabled();
});
