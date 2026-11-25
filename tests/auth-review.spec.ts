import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('authentication follows the reference layout and remains readable at all widths and saved themes', async ({
  page,
}) => {
  for (const theme of ['light', 'dark']) {
    await page.goto('/login');
    await page.evaluate((value) => {
      localStorage.setItem('hub-theme', value);
    }, theme);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 940 });
      for (const route of ['login', 'register']) {
        await page.goto('/' + route + '?next=%2Fnotifications');
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('.site-header')).toBeHidden();
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          .toBe(true);
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        ).toEqual([]);
        if (route === 'register') {
          const action = page.getByRole('button', { name: 'إنشاء حساب', exact: true });
          await expect(action).toBeEnabled();
          await expect(action).toHaveCSS('color', 'rgb(255, 255, 255)');
          await action.screenshot({
            path: test.info().outputPath(`auth-action-${theme}-${width}.png`),
          });
        }
        await page.screenshot({
          path: test.info().outputPath(`auth-${route}-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
  }
  await page.goto('/register?next=%2Fnotifications');
  await expect(page.getByLabel('الكلية', { exact: true })).toBeDisabled();
  await page.getByLabel('الجامعة', { exact: true }).selectOption('demo-university');
  await page.getByLabel('الكلية', { exact: true }).selectOption('demo-computing');
  await page.getByLabel('الجامعة', { exact: true }).selectOption('other-university');
  await expect(page.getByLabel('الكلية', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('الكلية', { exact: true })).toBeDisabled();
  await expect(page.locator('.checkbox a')).toHaveAttribute('href', '/privacy');
  await page.locator('[name=password]').fill('local-preview-only');
  await page.getByRole('button', { name: 'إظهار كلمة المرور', exact: true }).click();
  await expect(page.locator('[name=password]')).toHaveAttribute('type', 'text');
  await expect(page.locator('[name=confirmPassword]')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'إخفاء كلمة المرور', exact: true }).click();
  await expect(page.locator('[name=password]')).toHaveAttribute('type', 'password');
  await page.locator('.auth-switch a').click();
  await expect(page).toHaveURL(/\/login\?next=%2Fnotifications$/);
  await expect(page.getByText('الاستعادة غير مفعلة', { exact: true })).toBeVisible();
});
