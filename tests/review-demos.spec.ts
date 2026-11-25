import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: Page, key: string) {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function logout(page: Page) {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
}
test.use({ actionTimeout: 10000 });
const kinds = ['product', 'housing', 'restaurant', 'ticket'];
test('all four clearly marked store demos complete manual student-to-store-agent workflows', async ({
  page,
}) => {
  test.setTimeout(120000);
  await login(page, 'reviewstudent');
  const requests: string[] = [];
  for (const kind of kinds) {
    await page.goto('/store?kind=' + kind);
    await expect(page.locator('.review-demo-notice')).toHaveCount(0);
    await page.goto('/store/review-demo-v1-' + kind);
    await expect(page.locator('.review-demo-notice')).toHaveCount(0);
    if (kind === 'restaurant') {
      await page.getByRole('button', { name: 'أضف إلى الطلب' }).first().click();
      await page.getByRole('link', { name: /عرض الطلب،/ }).click();
      await page.getByRole('button', { name: 'دفع وإتمام عملية الشراء', exact: true }).click();
      await page.getByRole('link', { name: 'متابعة هذا الطلب', exact: true }).click();
      await expect(page).toHaveURL(/\/requests\/[^/]+$/);
      requests.push(page.url());
      continue;
    }
    const checkout = page.getByRole('link', {
      name: kind === 'housing' ? 'احجز الآن' : 'دفع وإتمام عملية الشراء',
      exact: true,
    });
    if (await checkout.count()) {
      await checkout.click();
      await page.getByRole('button', { name: 'دفع وإتمام عملية الشراء', exact: true }).click();
      await page.getByRole('link', { name: 'متابعة هذا الطلب', exact: true }).click();
      await expect(page).toHaveURL(/\/requests\/[^/]+$/);
      requests.push(page.url());
      continue;
    }
    await expect(page.getByRole('heading', { name: 'لديك طلب قيد المتابعة' })).toBeVisible();
    await page.getByRole('link', { name: 'متابعة هذا الطلب', exact: true }).click();
    await expect(page).toHaveURL(/\/requests\//);
    requests.push(page.url());
  }
  await logout(page);
  await login(page, 'storereview');
  await expect(page).toHaveURL(/\/agent$/);
  await expect(
    page
      .getByRole('complementary', { name: 'أقسام لوحتي' })
      .getByRole('navigation')
      .getByRole('link'),
  ).toHaveCount(4);
  for (const url of [
    '/manage?kind=service',
    '/manage/certificates',
    '/manage?kind=poll',
    '/agent?manage=content',
  ]) {
    await page.goto(url);
    await expect(
      page.getByRole('heading', { name: 'هذه الصفحة غير موجودة.', exact: true }),
    ).toBeVisible();
  }
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'هذه المساحة لفريق الإدارة.', exact: true }),
  ).toBeVisible();
  for (const url of requests) {
    await page.goto(url);
    if ((await page.locator('.status-pill').textContent()) !== 'مقبول') {
      await page.getByLabel('الحالة الجديدة').selectOption('accepted');
      await page.getByRole('button', { name: 'تحديث الحالة' }).click();
      await expect(page.getByRole('status')).toContainText('تم تحديث');
    }
    await page
      .getByLabel('ردك', { exact: true })
      .fill('تمت مراجعة الطلب الوهمي، هذه تجربة لا تعني دفعًا أو حجزًا حقيقيًا.');
    await page.getByRole('button', { name: 'إضافة رد', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'تمت إضافة' })).toBeVisible();
    await page.getByLabel('الحالة الجديدة').selectOption('completed');
    await page.getByRole('button', { name: 'تحديث الحالة' }).click();
    await expect(page.locator('.status-pill')).toHaveText('مكتمل');
  }
  await page.goto('/manage');
  await page.screenshot({ path: test.info().outputPath('store-test-agent.png'), fullPage: true });
});
test('demo catalog is readable in both themes and on small screens', async ({ page }) => {
  test.setTimeout(120000);
  await login(page, 'reviewstudent');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 940 });
      await page.goto('/store');
      await expect(
        page.getByRole('link', { name: 'حزمة أدوات المذاكرة', exact: true }),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
          .violations,
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath('demo-store-' + theme + '-' + width + '.png'),
        fullPage: true,
      });
    }
  }
  for (const kind of ['team', 'volunteer', 'poll']) {
    await page.goto('/services?kind=' + kind);
    await expect(page.locator('.review-demo-notice')).toHaveCount(0);
  }
});
test('core-service demo team joins, volunteer choices and poll votes persist', async ({ page }) => {
  test.setTimeout(90000);
  await login(page, 'reviewstudent');
  await page.goto('/services/review-demo-v1-team');
  if (await page.locator('textarea[name=body]').count()) {
    await page
      .locator('textarea[name=body]')
      .fill('طلب انضمام وهمي لاختبار المتابعة اليدوية داخل المنصة فقط.');
    await page.getByRole('button', { name: 'إرسال الطلب للمراجعة' }).click();
  }
  await expect(
    page
      .getByRole('link', { name: /متابعة/ })
      .filter({ hasText: /متابعة/ })
      .first(),
  ).toBeVisible();
  await page.goto('/services?kind=volunteer&volunteer=review-demo-v1-volunteer');
  const form = page.locator('.volunteer-application-form');
  if (await form.count()) {
    await form.getByRole('radio').first().check();
    await form.locator('[name=notes]').fill('طلب تطوع وهمي لاختبار اختيار القسم فقط.');
    await form.locator('[name=applicationConsent]').check();
    await form.getByRole('button', { name: 'تقديم الطلب', exact: true }).click();
  }
  await expect(page.getByRole('link', { name: 'متابعة طلبك الحالي', exact: true })).toBeVisible();
  await page.goto('/services?kind=poll&poll=review-demo-v1-poll');
  if (await page.getByRole('button', { name: 'تأكيد التصويت' }).count()) {
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: 'تأكيد التصويت' }).click();
    await expect(page.locator('.student-voice-status')).toHaveText('تم تسجيل صوتك');
  }
  await page.reload();
  await expect(page.locator('.student-voice-results')).toContainText('اختيارك');
  await page.screenshot({ path: test.info().outputPath('demo-poll-result.png'), fullPage: true });
});
