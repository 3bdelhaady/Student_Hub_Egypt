import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('store details never render the old manual review request form', async ({ page }) => {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demostudent.email);
  await page.locator('[name=password]').fill(accounts.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  for (const kind of ['product', 'housing', 'restaurant', 'ticket', 'trip']) {
    await page.goto('/store/review-demo-v1-' + kind);
    await expect(
      page.getByRole('button', { name: 'إرسال الطلب للمراجعة', exact: true }),
    ).toHaveCount(0);
    await expect(page.locator('textarea[name=body]')).toHaveCount(0);
    await expect(page.locator('[name=manualConsent]')).toHaveCount(0);
    if (kind === 'product' || kind === 'ticket' || kind === 'trip') {
      const checkout = page.getByRole('link', { name: 'دفع وإتمام عملية الشراء', exact: true });
      if (await checkout.count()) {
        await checkout.click();
        await expect(page.getByRole('radio', { name: /كاش/ })).toBeVisible();
        await expect(page.getByRole('radio', { name: /إلكتروني/ })).toBeVisible();
      }
    }
  }
});
