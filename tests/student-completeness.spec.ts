import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('student dark theme remains readable and responsive across the full workspace', async ({
  page,
}) => {
  test.setTimeout(110000);
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demostudent.email);
  await page.locator('[name=password]').fill(accounts.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/settings');
  await page.getByLabel('الوضع الداكن', { exact: true }).check();
  await page.getByRole('button', { name: 'حفظ التفضيلات', exact: true }).click();
  const issues: unknown[] = [];
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    for (const route of [
      '/account?view=student',
      '/courses/math-2',
      '/store',
      '/services',
      '/profile',
      '/requests',
      '/notifications',
      '/help',
      '/community',
      '/settings',
    ]) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      if (route === '/settings') await expect(page).toHaveURL(/\/profile/);
      await expect(page.locator('main')).not.toContainText('نجهّز مساحتك');
      await page.evaluate(async () => {
        await document.fonts.ready;
        getComputedStyle(document.body).backgroundColor;
        await Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        );
      });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      const r = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      if (r.violations.length)
        issues.push({
          route,
          width,
          violations: r.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        });
      await page.screenshot({
        path: test
          .info()
          .outputPath(
            `student-dark-${route.split('?')[0].slice(1).replaceAll('/', '-')}-${width}.png`,
          ),
        fullPage: true,
      });
    }
  }
  await page.getByRole('button', { name: 'فتح القائمة', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'قائمة الموبايل' })).toBeVisible();
  const menuCheck = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(menuCheck.violations).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('student-dark-mobile-menu.png'),
    fullPage: true,
  });
  expect(issues).toEqual([]);
});

test('system appearance follows device changes and cancelling leaves the saved setting intact', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/login');
  await page.waitForTimeout(11000);
  await page.locator('[name=email]').fill(accounts.demostudent.email);
  await page.locator('[name=password]').fill(accounts.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/settings');
  await page.getByLabel('إعدادات الجهاز', { exact: true }).check();
  await page.getByRole('button', { name: 'حفظ التفضيلات', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('الوضع الفاتح', { exact: true }).check();
  await page.getByRole('button', { name: 'إلغاء التغييرات', exact: true }).click();
  await expect(page.getByLabel('إعدادات الجهاز', { exact: true })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByLabel('إعدادات الجهاز', { exact: true })).toBeChecked();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
