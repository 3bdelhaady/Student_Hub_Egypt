import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('profile combines summary, appearance and account settings while preserving privacy', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demostudent.email);
  await page.locator('[name=password]').fill(accounts.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 940 });
      await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
      await page.goto('/profile');
      await expect(page.locator('.profile-summary')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'المظهر', exact: true })).toBeVisible();
      await expect(page.locator('input[name=department]')).toHaveCount(0);
      await expect(page.locator('main textarea')).toHaveCount(0);
      await expect(page.locator('main')).toContainText(accounts.demostudent.email);
      await expect(page.getByRole('button', { name: 'تسجيل الخروج', exact: true })).toBeVisible();
      await expect(page.locator('.mode-settings')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath('profile-summary-' + theme + '-' + width + '.png'),
        fullPage: true,
      });
    }
  await page.goto('/profile?edit=details');
  await expect(page.locator('[name=phone]')).toBeVisible();
  await page.goto(
    '/services?kind=service&opportunity=student-link-demo-research&apply=student-link-demo-research',
  );
  await expect(page.locator('.opportunity-application')).toBeVisible();
  await page.locator('.opportunity-application').scrollIntoViewIfNeeded();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('application-consent-dark-390.png'),
    fullPage: false,
  });
});
