import { test, expect } from '@playwright/test';
test('guest landing cards preserve signup destination and Arabic remains locked', async ({
  page,
}) => {
  await page
    .context()
    .addCookies([{ name: 'hub-language', value: 'en', domain: 'localhost', path: '/' }]);
  await page.goto('/');
  for (const a of await page.locator('.reference-service,.landing-core-card').all())
    await expect(a).toHaveAttribute('href', /^\/register\?next=/);
  await expect(page.locator('footer').getByLabel('اللغة', { exact: true })).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('.public-statistics-card h3')).toHaveText([
    'عدد الكليات',
    'عدد الطلاب',
    'عدد المؤسسات',
  ]);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page
    .locator('.reference-numbers')
    .screenshot({ path: test.info().outputPath('real-platform-counts.png') });
});
