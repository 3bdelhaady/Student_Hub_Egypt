import { test, expect } from '@playwright/test';
test('robot uses the owner supplied light image and gentle motion honors reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  const image = page.locator('.reference-photo img');
  await expect(image).toHaveAttribute('src', /blue-robot-hero\.jpg/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(image).toHaveCSS('animation-name', 'robot-gentle-float');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(image).toHaveCSS('animation-name', 'none');
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 940 });
    await page.screenshot({
      path: test.info().outputPath(`light-robot-${width}.png`),
      fullPage: false,
    });
  }
});
