import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: Page, key: string) {
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني الجامعي', { exact: true }).fill(accounts[key].email);
  await page.locator('input[name=password]').fill(accounts[key].password);
  for (let i = 0; i < 3; i++) {
    const response = page.waitForResponse(
      (r) => r.url().includes('/api/auth/sign-in/email') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    const result = await response;
    if (result.status() === 200) break;
    expect(result.status()).toBe(429);
    await page.waitForTimeout(11000);
  }
  await expect(page).toHaveURL(/\/(account|courses\/[^/?]+|agent|manage|admin\?tab=institutions)$/);
}
test.beforeEach(async () => {
  await new Promise((r) => setTimeout(r, 11000));
});
test('student dashboard reads published faculty/private posts but never agent management', async ({
  page,
}) => {
  await login(page, 'demostudent');
  await page.goto('/community?tab=faculty');
  await expect(page).toHaveURL(/community\?tab=faculty/);
  await expect(page.locator('.newsletter-notices')).toContainText('المتجر الرئيسي');
  await page.goto('/agent');
  await expect(page.getByText('لا يوجد تعيين', { exact: false })).toBeVisible();
  await expect(page.locator('#institution-team')).toHaveCount(0);
  await expect(page.locator('#domain-content')).toHaveCount(0);
});
test('university super agent sees both university departments but cannot edit private sector', async ({
  page,
}) => {
  await login(page, 'demoagent');
  await page.goto('/manage/content');
  await expect(page.locator('#institution-team')).toBeVisible();
  await expect(page.locator('#domain-content')).toContainText('خطوتك الأولى');
  await expect(page.locator('#domain-content')).toContainText('مساحة رعاية الشباب');
  await page.goto('/manage/content?edit=demo-private-notice');
  await expect(page.getByText('المحتوى أو صلاحية تعديله غير متاحة في نطاقك.')).toBeVisible();
  await page.goto('/manage/content?edit=demo-affairs-notice');
  await page.getByLabel('عنوان محتوى القسم').fill('محاولة غير مسموحة');
  // Rewrite the scoped id at the network layer. Mutating the DOM input races
  // React hydration, which can restore the original id and rename the
  // in-scope notice instead of proving the server rejects the spoof.
  await page.route('**/manage/content**', async (route) => {
    const request = route.request();
    const data = request.postData();
    if (request.method() === 'POST' && data?.includes('demo-affairs-notice'))
      return route.continue({
        postData: data.replaceAll('demo-affairs-notice', 'demo-private-notice'),
      });
    return route.continue();
  });
  await page.getByRole('button', { name: 'حفظ محتوى القسم', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.unroute('**/manage/content**');
  await page.goto('/manage/content');
  await expect(page.locator('#domain-content')).toContainText('خطوتك الأولى');
  await page.screenshot({ path: test.info().outputPath('hub-agent-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({ path: test.info().outputPath('hub-agent-mobile.png'), fullPage: true });
});
test('student affairs cannot activate officers, spoof faculty or change another faculty access', async ({
  page,
}) => {
  await login(page, 'demoagent');
  await page.goto('/manage/content');
  const officer = page.locator('tr').filter({ hasText: accounts.union.email });
  await expect(officer).toBeVisible();
  await officer.locator('input[name=status]').evaluate((e: HTMLInputElement) => {
    e.value = 'suspended';
  });
  await officer.getByRole('button', { name: 'تأكيد الصلاحيات' }).click();
  await expect(officer.getByRole('alert')).toBeVisible();
  await page.reload();
  await page.waitForLoadState('networkidle');
  const row = page.locator('tr').filter({ hasText: accounts.union.email });
  await row.locator('input[name=id]').evaluate((e: HTMLInputElement) => {
    e.value = 'fixture-otheraffairs';
  });
  await row.getByRole('button', { name: 'تأكيد الصلاحيات' }).click();
  await expect(row.getByRole('alert')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'منح صلاحية Coordinator', exact: true }),
  ).toBeVisible();
  await expect(page.locator('input[name=newPassword]')).toHaveCount(0);
});
test('welfare, union presidents, other faculty and pending accounts cannot inherit team powers', async ({
  browser,
}) => {
  test.setTimeout(180000);
  for (const key of ['welfare', 'union', 'otheraffairs', 'pendingagent', 'readagent']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, key);
    await page.goto('/manage/content');
    if (key === 'otheraffairs') {
      await expect(page.locator('#institution-team')).toBeVisible();
      await expect(page.locator('#institution-team')).not.toContainText(accounts.union.email);
      await expect(page.locator('#domain-content')).not.toContainText('خطوتك الأولى');
    } else {
      await expect(page.locator('#institution-team')).toHaveCount(0);
    }
    if (key === 'pendingagent') {
      await expect(page.locator('#domain-content')).toHaveCount(0);
    }
    if (key === 'readagent') {
      await page.goto('/manage/content?new=1');
      await expect(page.getByRole('button', { name: 'حفظ محتوى القسم' })).toHaveCount(0);
    }
    await context.close();
    await new Promise((r) => setTimeout(r, 11000));
  }
});
test('platform admin manually creates institutions and reviews activation; mobile remains usable', async ({
  page,
}) => {
  await login(page, 'demoadmin');
  await page.goto('/admin?tab=institutions&new=1');
  await page.getByLabel('اسم المؤسسة', { exact: true }).fill('مؤسسة اختبار وهمية');
  await page.getByLabel('نوع المؤسسة', { exact: true }).selectOption('private_sector');
  await page.getByLabel('تصنيف المؤسسة', { exact: true }).selectOption('restaurant');
  await page.getByLabel('المحافظة', { exact: true }).selectOption('قنا');
  await page.getByRole('button', { name: 'حفظ المؤسسة', exact: true }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.goto('/admin?tab=agents');
  await page
    .locator('tr')
    .filter({ hasText: accounts.pendingagent.email })
    .getByRole('link')
    .click();
  const row = page.locator('.console-agent-detail');
  for (const status of ['active', 'pending']) {
    await row.getByLabel('حالة التفعيل', { exact: true }).selectOption(status);
    const saved = page.waitForResponse(
      (r) => r.request().method() === 'POST' && !!r.request().headers()['next-action'],
    );
    await row.getByRole('button', { name: 'تأكيد الصلاحيات' }).click();
    await saved;
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(row.getByLabel('حالة التفعيل', { exact: true })).toHaveValue(status);
  }
  await page.screenshot({ path: test.info().outputPath('hub-platform-admin.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({
    path: test.info().outputPath('hub-platform-admin-mobile.png'),
    fullPage: true,
  });
});

test('demo credentials cannot cross from student or agent into platform admin', async ({
  request,
}) => {
  for (const key of ['demostudent', 'demoagent']) {
    const response = await request.post('/api/auth/sign-in/email', {
      headers: { origin: 'http://localhost:3000' },
      data: { email: accounts.demoadmin.email, password: accounts[key].password },
    });
    expect(response.status()).toBe(401);
  }
});
