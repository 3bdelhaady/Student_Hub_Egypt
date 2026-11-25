import { test, expect } from '@playwright/test';
test('footer links to the Student Hub YouTube, LinkedIn and Facebook pages', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('footer .footer-social a');
  await expect(links).toHaveCount(3);
  const hrefs = await links.evaluateAll((items) =>
    items.map((item) => (item as HTMLAnchorElement).href),
  );
  expect(hrefs).toEqual([
    'https://www.facebook.com/StudentHubEgypt',
    'https://www.linkedin.com/company/student-hub-egypt',
    'https://www.youtube.com/@studenthubegypt',
  ]);
  for (const item of await links.all()) {
    await expect(item).toHaveAttribute('target', '_blank');
    await expect(item).toHaveAttribute('rel', /noopener/);
    await expect(item).toHaveAttribute('aria-label', /Student Hub/);
  }
  await page.goto('/about');
  await expect(page.locator('footer .footer-social a')).toHaveCount(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('footer .footer-social a').first()).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
});
