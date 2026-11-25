import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
const image = fs.readFileSync('public/design/juice.jpg');
async function login(page: Page, key: string) {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
}
test('commerce forms upload five images, keep section details and remove advanced targeting', async ({
  page,
  browser,
}) => {
  await login(page, 'storereview');
  for (const kind of ['product', 'housing', 'restaurant', 'ticket']) {
    await page.goto('/agent?kind=' + kind + '&new=1');
    await expect(page.getByLabel('اسم العنصر', { exact: true })).toBeVisible();
    await expect(page.getByLabel('الوصف', { exact: true })).toBeVisible();
    await expect(
      page.getByLabel(kind === 'ticket' ? 'سعر التذكرة 1' : 'السعر بالجنيه المصري', {
        exact: true,
      }),
    ).toBeVisible();
    for (const name of [
      'نوع الخدمة',
      'التصنيف',
      'رابط الصورة، اختياري',
      'الموقع أو جهة تقديم الخدمة',
      'السعة المتاحة، اتركها فارغة إن لم تنطبق',
      'تاريخ البداية، توقيت القاهرة',
    ])
      await expect(page.getByLabel(name, { exact: true })).toHaveCount(0);
  }
  for (const kind of ['housing', 'restaurant', 'ticket']) {
    await page.goto('/agent?kind=' + kind + '&new=1');
    const title = 'عنصر تحقق مبسط ' + kind + Date.now();
    await page.getByLabel('اسم العنصر', { exact: true }).fill(title);
    await page
      .getByLabel('الوصف', { exact: true })
      .fill('وصف عنصر تحقق محلي للتأكد من حفظ بيانات القسم وتعديلها.');
    await page
      .getByLabel(kind === 'ticket' ? 'سعر التذكرة 1' : 'السعر بالجنيه المصري', { exact: true })
      .fill('90');
    await page.getByRole('button', { name: 'حفظ العنصر', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('تم حفظ');
    await page.goto('/agent?kind=' + kind);
    const row = page.locator('tbody tr').filter({ hasText: title });
    await row.getByRole('link', { name: 'تعديل', exact: true }).click();
    await expect(
      page.getByLabel(kind === 'ticket' ? 'سعر التذكرة 1' : 'السعر بالجنيه المصري', {
        exact: true,
      }),
    ).toHaveValue('90');
  }
  await page.goto('/agent?kind=product&new=1');
  const title = 'عنصر صور واستهداف ' + Date.now();
  await page.getByLabel('اسم العنصر', { exact: true }).fill(title);
  await page
    .getByLabel('الوصف', { exact: true })
    .fill('وصف عنصر محلي لاختبار الصور والتحديد المتقدم دون تغيير محتوى قائم.');
  await page.getByLabel('السعر بالجنيه المصري').fill('75');
  await page.getByLabel('رفع الصور', { exact: true }).setInputFiles(
    Array.from({ length: 6 }, (_, i) => ({
      name: 'photo' + i + '.jpg',
      mimeType: 'image/jpeg',
      buffer: image,
    })),
  );
  await expect(page.locator('p[role=alert]')).toContainText('٥ صور');
  await page.getByLabel('رفع الصور', { exact: true }).setInputFiles(
    Array.from({ length: 5 }, (_, i) => ({
      name: 'photo' + i + '.jpg',
      mimeType: 'image/jpeg',
      buffer: image,
    })),
  );
  await expect(page.getByText('تحديد متقدم', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('simple-add-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'حفظ العنصر', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/agent?kind=product');
  const row = page.locator('tbody tr').filter({ hasText: title });
  const href = await row.getByRole('link', { name: 'تعديل', exact: true }).getAttribute('href');
  const id = new URL(href!, 'http://localhost:3000').searchParams.get('edit')!;
  await row.getByRole('link', { name: 'تعديل', exact: true }).click();
  await expect(page.locator('.commerce-image-previews img')).toHaveCount(5);
  const src = await page.locator('.commerce-image-previews img').first().getAttribute('src');
  expect((await page.request.get(src!)).status()).toBe(200);
  await page.screenshot({
    path: test.info().outputPath('simple-edit-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('simple-edit-mobile.png'), fullPage: true });
  // Tamper with native input without firing client onChange: server must enforce the same maximum.
  await page.locator('input[type=file]').evaluate((el) => {
    const dt = new DataTransfer();
    dt.items.add(
      new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'sixth.png', {
        type: 'image/png',
      }),
    );
    (el as HTMLInputElement).files = dt.files;
  });
  await page.getByRole('button', { name: 'حفظ العنصر', exact: true }).click();
  await expect(page.locator('p[role=alert]')).toBeVisible();
  const student = await browser.newPage();
  await login(student, 'demostudent');
  await student.goto('/store/' + id);
  await expect(student.getByRole('heading', { name: title, exact: true })).toBeVisible();
  expect((await student.request.get(src!)).status()).toBe(200);
  const outsider = await browser.newPage();
  await login(outsider, 'outsider');
  await outsider.goto('/store/' + id);
  await expect(outsider.getByRole('heading', { name: title, exact: true })).toBeVisible();
  expect((await outsider.request.get(src!)).status()).toBe(200);
  await outsider.goto('/store/' + id + '/checkout');
  await expect(outsider.getByRole('heading', { name: 'ملخص الطلب', exact: true })).toBeVisible();
  await outsider.close();
  await student.close();
});
