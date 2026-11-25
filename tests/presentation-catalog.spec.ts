import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('presentation catalog has housing, menus and tickets without changing payment rules', async ({
  page,
}) => {
  await page.goto('/login');
  await page.locator('[name=email]').fill(a.demostudent.email);
  await page.locator('[name=password]').fill(a.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  for (const [kind, id] of [
    ['housing', 'housing-room'],
    ['restaurant', 'restaurant-table'],
    ['ticket', 'ticket-culture'],
  ]) {
    await page.goto('/store/presentation-v1-' + id);
    await expect(page.locator('h1').first()).toBeVisible();
    if (kind === 'restaurant')
      await expect(page.getByRole('button', { name: 'أضف إلى الطلب' })).toHaveCount(4);
    if (kind === 'housing') await expect(page.getByText('3 غرف', { exact: true })).toHaveCount(1);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 960 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.screenshot({
          path: test.info().outputPath(kind + '-' + theme + '-' + width + '.png'),
          fullPage: true,
        });
      }
    }
  }
  await page.goto('/store/presentation-v1-housing-room/checkout');
  await page.getByRole('radio', { name: /إلكتروني/ }).check();
  await expect(
    page.getByText('الرصيد غير كافٍ، شحن الرصيد غير متاح حاليًا، لم يُخصم أي مبلغ.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'شحن أموال للكرت' })).toBeDisabled();
});
