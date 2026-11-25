import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(p: Page, k: string) {
  await p.waitForTimeout(11000);
  await p.goto('/login');
  await p.locator('[name=email]').fill(accounts[k].email);
  await p.locator('[name=password]').fill(accounts[k].password);
  await p.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(p).not.toHaveURL(/login/);
}
test('six management sections update lower content, create own items, export scoped registrations and archive safely', async ({
  page,
  browser,
}) => {
  test.setTimeout(120000);
  await login(page, 'union');
  for (const kind of ['ticket', 'team', 'volunteer', 'certificate', 'service', 'poll']) {
    await page.goto('/manage?kind=' + kind);
    await expect(page.locator('#section-content')).toBeVisible();
    await expect(page.locator('#section-content>header h2')).toBeVisible();
    if (kind === 'volunteer')
      await expect(page.locator('#section-content .request-list')).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath('section-' + kind + '.png'),
      fullPage: true,
    });
    if (kind === 'certificate') {
      await expect(page.getByRole('heading', { name: 'سجل الشهادات', exact: true })).toHaveCount(0);
      await expect(
        page.getByText('أي إضافة أو تعديل يرسل إلى شؤون الطلاب', { exact: false }),
      ).toHaveCount(0);
    }
  }
  const title = 'فرصة إدارة محلية ' + Date.now();
  await page.goto('/manage?kind=service&new=1');
  await expect(page.locator('input[name=kind]')).toHaveValue('service');
  await page.getByLabel('العنوان', { exact: true }).fill(title);
  await page
    .getByLabel('الوصف', { exact: true })
    .fill('فرصة اختبار محلي فقط لحفظ الملكية والطلبات والحذف الآمن.');
  await page.getByRole('button', { name: 'حفظ كمسودة', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/manage?kind=service');
  let row = page.getByRole('row').filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.getByLabel('أؤكد حذف العنصر من العرض مع الاحتفاظ بالطلبات السابقة').check();
  await row.getByRole('button', { name: 'حذف العنصر', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0);
  await page.goto('/manage?kind=ticket&new=1');
  const ticket = 'تذكرة إدارة محلية ' + Date.now();
  await expect(page.locator('select[name=kind]')).toHaveValue('ticket');
  await page.getByLabel('العنوان', { exact: true }).fill(ticket);
  await page
    .getByLabel('الوصف والتفاصيل', { exact: true })
    .fill('تذكرة اختبار محلي لا تمثل حدثًا أو حجزًا حقيقيًا.');
  await page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/manage?kind=ticket');
  row = page.getByRole('row').filter({ hasText: ticket });
  const href = await row
    .getByRole('link', { name: 'تحميل بيانات المسجلين CSV', exact: true })
    .getAttribute('href');
  const response = await page.request.get(href!);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('الكلية');
  expect(await response.text()).not.toContain('قومي');
  const guest = await browser.newContext();
  expect((await guest.request.get(href!)).status()).toBe(401);
  await guest.close();
  await page.goto('/manage?kind=poll&new=1');
  await expect(page.locator('input[name=kind]')).toHaveValue('poll');
  await expect(page.getByLabel('الخيار 1', { exact: true })).toBeVisible();
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
      await page.goto('/manage?kind=ticket');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath(`section-ticket-${theme}-${width}.png`),
        fullPage: true,
      });
    }
});
