import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('affairs grants social service; Coordinator submits; affairs edits approves schedules and disconnected publish', async ({
  page,
}) => {
  test.setTimeout(150000);
  async function login(key: string) {
    await page.waitForTimeout(11000);
    await page.goto('/login');
    await page.locator('[name=email]').fill(accounts[key].email);
    await page.locator('[name=password]').fill(accounts[key].password);
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    await expect(page).not.toHaveURL(/login/);
  }
  async function logout() {
    await page.goto('/settings');
    await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  }
  await login('demoagent');
  await page.goto('/manage/access');
  // Permission cards show the target email outside the form, so identify the containing card.
  const card = page
    .locator('.portal-form-section')
    .filter({ hasText: accounts.union.email })
    .first();
  const grant = card.locator('form').first();
  await grant.getByRole('checkbox', { name: 'إدارة قنوات التواصل: قراءة', exact: true }).check();
  await grant.getByRole('checkbox', { name: 'إدارة قنوات التواصل: تعديل', exact: true }).check();
  await grant.getByRole('button').last().click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await logout();
  await login('union');
  await page.goto('/manage/social');
  const body = 'منشور محلي لاختبار خدمة قنوات التواصل ' + Date.now();
  await page.locator('select[name=channel]').selectOption('youtube');
  await page.locator('select[name=scope]').selectOption('university');
  await page.locator('textarea[name=body]').fill(body);
  await page.getByRole('button', { name: 'إرسال إلى شؤون الطلاب', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('أُرسل');
  await logout();
  await login('demoagent');
  await page.goto('/manage/social');
  const post = page
    .locator('article')
    .filter({ has: page.locator('textarea[name=body]') })
    .filter({ hasText: 'يوتيوب' })
    .first();
  await post.locator('textarea[name=body]').fill(body + ' بعد مراجعة شؤون الطلاب');
  await post.locator('select[name=intent]').selectOption('approve');
  await post.getByRole('button').click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.reload();
  const approved = page.locator('article').filter({ hasText: 'مقبول للمراجعة النهائية' }).first();
  await approved.locator('select[name=intent]').selectOption('reject');
  await approved.locator('textarea[name=reviewNote]').fill('راجع صياغة المنشور');
  await approved.getByRole('button').click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.reload();
  const rejected = page.locator('article').filter({ hasText: 'مرفوض' }).first();
  await rejected.locator('select[name=intent]').selectOption('schedule');
  await rejected.locator('[name=scheduledAt]').fill('2030-12-15T14:30');
  await rejected.getByRole('button').click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.reload();
  const scheduled = page.locator('article').filter({ hasText: 'مجدول داخليًا' }).first();
  await scheduled.locator('select[name=intent]').selectOption('publish');
  await scheduled.getByRole('button').click();
  await expect(page.getByRole('status')).toContainText('لم يتم النشر');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
    ).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath('social-' + width + '.png'),
      fullPage: true,
    });
  }
  await logout();
  await login('otheraffairs');
  await page.goto('/manage/social');
  await expect(page.locator('textarea[name=body]').filter({ hasText: body })).toHaveCount(0);
});
