import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
// Respect the authentication rate limit across adjacent browser suites.
test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 11000));
});
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: Page, key: string) {
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/\/(account|courses\/[^/?]+|agent|manage|admin\?tab=institutions)$/);
}
test('student workspace is responsive and cannot grant itself agent mode', async ({ page }) => {
  test.setTimeout(180000);
  await login(page, 'demostudent');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    for (const route of ['/account?view=student', '/courses/math-2', '/settings', '/help']) {
      await page.goto(route);
      await expect(page.locator('.student-workspace')).toBeVisible();
      if (route === '/settings') await expect(page).toHaveURL(/\/profile$/);
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({
        path: test
          .info()
          .outputPath(`hub-figma-student-${route.split('?')[0].replaceAll('/', '-')}-${width}.png`),
        fullPage: true,
      });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
    }
  }
  await page.goto('/settings');
  await expect(page.locator('.mode-settings')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'حفظ نوع الحساب' })).toHaveCount(0);
  await page.goto('/agent');
  await expect(page.getByText('لا يوجد تعيين', { exact: false })).toBeVisible();
});
test('a granted union agent switches modes on the same account and persists its choice', async ({
  page,
}) => {
  test.setTimeout(180000);
  await login(page, 'union');
  await page.goto('/settings');
  await page.locator('[value=student]').check();
  await page.getByRole('button', { name: 'حفظ نوع الحساب' }).click();
  await expect(page).toHaveURL(/account\?view=student/);
  await expect(page.locator('.student-workspace')).toBeVisible();
  await page.reload();
  await page.goto('/account');
  await expect(page).toHaveURL(/\/account$/);
  await page.goto('/agent');
  await expect(page).toHaveURL(/account\?view=student/);
  await page.goto('/settings');
  await page.locator('[value=agent]').check();
  await page.getByRole('button', { name: 'حفظ نوع الحساب' }).click();
  await expect(page).toHaveURL(/\/manage$/);
  await expect(
    page.getByRole('heading', { name: 'إدارة الخدمات والطلبات', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#institution-team')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('مساحة رعاية الشباب');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'إدارة الخدمات والطلبات', exact: true }),
  ).toBeVisible();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`hub-figma-agent-${width}.png`),
      fullPage: true,
    });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});
test('agent-only accounts do not get the student-agent mode control', async ({ page }) => {
  await login(page, 'demoagent');
  await page.goto('/settings');
  await expect(page.locator('.mode-settings')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'حفظ نوع الحساب' })).toHaveCount(0);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/agent$/);
  await page.goto('/account?view=student');
  await expect(page).toHaveURL(/\/agent$/);
});
