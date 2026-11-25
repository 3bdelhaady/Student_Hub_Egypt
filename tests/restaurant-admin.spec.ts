import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(p: Page, key: string) {
  await p.waitForTimeout(11000);
  await p.goto('/login');
  await p.locator('[name=email]').fill(a[key].email);
  await p.locator('[name=password]').fill(a[key].password);
  await p.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(p).not.toHaveURL(/login/);
}
test('only platform admin manages restaurant info and agent menu saves preserve it', async ({
  page,
  browser,
}) => {
  test.setTimeout(110000);
  await login(page, 'admin');
  await page.goto('/admin/restaurants?edit=review-demo-v1-restaurant');
  await expect(page).toHaveURL(/tab=institutions&edit=/);
  await page.getByLabel('تصنيف المؤسسة', { exact: true }).selectOption('general');
  await expect(page.getByRole('group', { name: 'بيانات المطعم', exact: true })).toHaveCount(0);
  await page.getByLabel('تصنيف المؤسسة', { exact: true }).selectOption('restaurant');
  await expect(page.getByRole('group', { name: 'بيانات المطعم', exact: true })).toBeVisible();
  await page.getByLabel('تصنيف المؤسسة', { exact: true }).selectOption('general');
  await expect(page.getByRole('group', { name: 'بيانات المطعم', exact: true })).toHaveCount(0);
  await page.getByLabel('تصنيف المؤسسة', { exact: true }).selectOption('restaurant');
  await page.getByLabel('المحافظة', { exact: true }).selectOption('قنا');
  const id = 'review-demo-v1-restaurant';
  await expect(page.getByText('حالة المطعم', { exact: true })).toHaveCount(0);
  await page.locator('[name=opensAt]').fill('09:00');
  await page.locator('[name=closesAt]').fill('23:00');
  await page.locator('[name=delivery]').selectOption('yes');
  await page.locator('[name=phone]').fill('01012345678');
  await page.locator('[name=mapUrl]').fill('https://maps.google.com/?q=Qena');
  await page.locator('[name=logo]').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWAAAAABJRU5ErkJggg==',
      'base64',
    ),
  });
  await page.locator('[name=cover]').setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWAAAAABJRU5ErkJggg==',
      'base64',
    ),
  });
  await page.getByRole('button', { name: 'حفظ المؤسسة', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.reload();
  await expect(page.locator('[name=opensAt]')).toHaveValue('09:00');
  await expect(page.locator('form img[alt="لوجو المطعم"]')).toBeVisible();
  await expect(page.locator('form img[alt="كافر المطعم"]')).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('restaurant-admin-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: test.info().outputPath('restaurant-admin-mobile.png'),
    fullPage: true,
  });
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.setViewportSize({ width: 1440, height: 1100 });
  const agent = await browser.newPage();
  await login(agent, 'storereview');
  await agent.goto('/admin/restaurants?edit=' + id);
  await expect(
    agent.getByRole('heading', { name: 'هذه الصفحة غير موجودة.', exact: true }),
  ).toBeVisible();
  await agent.goto('/agent?kind=restaurant&edit=' + id);
  await expect(
    agent.locator(
      '[name=restaurantOpen],[name=restaurantHours],[name=restaurantPhone],[name=restaurantDelivery],[name=location]',
    ),
  ).toHaveCount(0);
  const card = agent.getByRole('region', { name: 'بيانات المؤسسة', exact: true });
  await expect(card.getByText('09:00 - 23:00', { exact: true })).toBeVisible();
  await expect(card.locator('input,select,textarea,button')).toHaveCount(0);
  await agent.locator('form.commerce-item-form').evaluate((f) => {
    for (const [name, value] of Object.entries({
      restaurantOpen: 'closed',
      restaurantPhone: '01100000000',
      restaurantHours: 'forged',
      restaurantDelivery: 'no',
      location: 'forged',
    })) {
      const i = document.createElement('input');
      i.type = 'hidden';
      i.name = name;
      i.value = value;
      f.append(i);
    }
  });
  await agent.getByRole('button', { name: 'حفظ العنصر', exact: true }).click();
  await expect(agent.getByRole('status')).toContainText('تم حفظ');
  await agent.screenshot({
    path: test.info().outputPath('restaurant-agent-menu-desktop.png'),
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator('[name=phone]')).toHaveValue('01012345678');
  await expect(page.locator('[name=delivery]')).toHaveValue('yes');
  await page.goto('/store/' + id);
  await expect(page.getByText('09:00 - 23:00', { exact: true })).toBeVisible();
  await page.goto('/admin/restaurants?edit=' + id);
  await page.getByLabel('تصنيف المؤسسة', { exact: true }).selectOption('general');
  await page.getByRole('button', { name: 'حفظ المؤسسة', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await expect(page.getByRole('group', { name: 'بيانات المطعم', exact: true })).toHaveCount(0);
  await agent.close();
});
