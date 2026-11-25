import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
test('public surfaces have no automated WCAG A/AA violations', async ({ page }) => {
  for (const route of [
    '/',
    '/courses',
    '/community',
    '/register',
    '/login',
    '/privacy',
    '/help',
    '/faq',
  ]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
      route,
    ).toEqual([]);
  }
});

test('authenticated student/admin surfaces pass automated accessibility checks', async ({
  page,
}) => {
  const account = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8')).admin;
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني الجامعي', { exact: true }).fill(account.email);
  await page.locator('input[name=password]').fill(account.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/\/(account|courses\/[^/?]+|admin\?tab=institutions)$/);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      '/account?view=student',
      '/courses/math-2',
      '/admin',
      '/admin?tab=members',
      '/admin?tab=courses&new=1',
      '/admin?tab=resources&new=1',
      '/admin?tab=posts&new=1',
    ]) {
      await page.goto(route);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
        })),
        `${route} ${width}`,
      ).toEqual([]);
    }
  }
});
