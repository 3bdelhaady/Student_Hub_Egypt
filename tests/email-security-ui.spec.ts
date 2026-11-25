import { test, expect } from '@playwright/test';
test('email security routes are hidden by default or accessible under explicit activation', async ({
  page,
}) => {
  const enabled = process.env.AUTH_EMAIL_ENABLED === 'true';
  await page.goto('/login');
  await expect(page.getByRole('link', { name: 'نسيت كلمة المرور؟' })).toHaveCount(enabled ? 1 : 0);
  for (const route of ['forgot-password', 'verify-email', 'reset-password']) {
    const response = await page.goto('/' + route);
    if (enabled) expect(response?.status()).toBe(200);
    else {
      await expect(page.locator('.figma-auth-card form')).toHaveCount(0);
      await expect(page.getByText('تأكيد البريد الإلكتروني', { exact: true })).toHaveCount(0);
    }
    if (enabled) {
      await expect(page.locator('.figma-auth-card form')).toBeVisible();
      await page.screenshot({ path: test.info().outputPath(route + '-desktop.png') });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: test.info().outputPath(route + '-mobile.png') });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.setViewportSize({ width: 1440, height: 1100 });
    }
  }
});
