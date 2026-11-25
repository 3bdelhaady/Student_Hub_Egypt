import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const account = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8')).demostudent;
test('Arabic-only mode ignores old English preference before and after sign-in', async ({
  page,
}) => {
  await page
    .context()
    .addCookies([{ name: 'hub-language', value: 'en', domain: 'localhost', path: '/' }]);
  for (const path of ['/', '/help', '/login']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.footer-language-switch')).toHaveCount(0);
  }
  await page.locator('[name=email]').fill(account.email);
  await page.locator('[name=password]').fill(account.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/services');
  await expect(page.locator('.learning-center-gateways')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'دوراتك الخاصة', exact: true })).toBeVisible();
  await page.goto('/settings');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('[name=language]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'الملف الشخصي', exact: true })).toBeVisible();
});
