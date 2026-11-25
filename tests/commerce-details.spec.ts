import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('private-sector housing details and restaurant menu save and reopen with no targeting', async ({
  page,
}) => {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(a.storereview.email);
  await page.locator('[name=password]').fill(a.storereview.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  for (const kind of ['housing', 'restaurant']) {
    await page.goto('/agent?kind=' + kind + '&new=1');
    const title = 'تفاصيل ' + kind + Date.now();
    await page.getByLabel('اسم العنصر', { exact: true }).fill(title);
    await page.getByLabel('الوصف', { exact: true }).fill('وصف تفصيلي للعناصر والخدمات الطلابية');
    await page.getByLabel('السعر بالجنيه المصري', { exact: true }).fill('100');
    if (kind === 'housing') await page.getByLabel('الموقع', { exact: true }).fill('قنا');
    await expect(page.getByText('تحديد متقدم', { exact: true })).toHaveCount(0);
    if (kind === 'housing') {
      await page.locator('[name=housingType]').selectOption('room');
      await page.getByLabel('عدد الغرف', { exact: true }).fill('3');
      await page.getByLabel('واي فاي', { exact: true }).check();
      await page.getByLabel('التأمين بالجنيه', { exact: true }).fill('200');
    } else {
      await expect(
        page.locator('[name=restaurantOpen],[name=restaurantHours],[name=restaurantPhone]'),
      ).toHaveCount(0);
      await page.getByRole('button', { name: 'إضافة صنف للقائمة', exact: true }).click();
      await page.getByLabel('اسم الصنف', { exact: true }).fill('وجبة غداء');
      await page.getByLabel('السعر بالجنيه', { exact: true }).fill('100');
      await page.getByLabel('وصف الصنف', { exact: true }).fill('وجبة دجاج وأرز');
    }
    await page.getByRole('button', { name: 'حفظ العنصر', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('تم حفظ');
    await page.goto('/agent?kind=' + kind);
    await page
      .locator('tbody tr')
      .filter({ hasText: title })
      .getByRole('link', { name: 'تعديل', exact: true })
      .click();
    if (kind === 'housing')
      await expect(page.getByLabel('عدد الغرف', { exact: true })).toHaveValue('3');
    else await expect(page.getByLabel('اسم الصنف', { exact: true })).toHaveValue('وجبة غداء');
    await page.screenshot({
      path: test.info().outputPath(kind + '-form-desktop.png'),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: test.info().outputPath(kind + '-form-mobile.png'),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
});
