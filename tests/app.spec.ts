import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8')) as Record<
  string,
  { email: string; password: string }
>;
async function login(page: Page, role = 'student') {
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني الجامعي', { exact: true }).fill(accounts[role].email);
  await page.locator('input[name=password]').fill(accounts[role].password);
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = page.waitForResponse(
      (r) => r.url().includes('/api/auth/sign-in/email') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    const result = await response;
    if (result.status() !== 429) {
      expect(result.status(), 'login response').toBe(200);
      break;
    }
    const retry = Math.max(11, Number(result.headers()['retry-after']) || 11);
    await page.waitForTimeout(retry * 1000);
  }
  await expect(page).toHaveURL(/\/(account|courses\/[^/?]+|admin\?tab=institutions)$/);
}
// Preserve the real authentication throttle; space test cases so sign-in traffic stays below its short-window limit.
test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 11000));
});
const shots = path.resolve(process.env.VISUAL_OUTPUT_DIR || 'test-results/visual');
fs.mkdirSync(shots, { recursive: true });
test('public routes, filters, draft protection and responsive views', async ({ page }) => {
  for (const route of [
    '/',
    '/courses',
    '/community',
    '/about',
    '/privacy',
    '/register',
    '/login',
    '/courses/math-2',
    '/community/welcome',
  ]) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  }
  await page.goto('/courses/draft-course');
  await expect(page.getByRole('heading', { name: 'هذه الصفحة غير موجودة.' })).toBeVisible();
  await page.goto('/courses?q=NO_MATCH');
  await expect(page.getByRole('heading', { name: 'لا توجد نتائج حاليًا.' })).toBeVisible();
  await page.goto('/courses/math-2');
  await expect(page.locator('body')).not.toContainText('المعادلة التفاضلية تربط');
  await expect(page.getByRole('heading', { name: 'هذه الصفحة غير موجودة.' })).toBeVisible();
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      '/',
      '/courses',
      '/community',
      '/about',
      '/privacy',
      '/register',
      '/login',
      '/help',
      '/faq',
      '/courses/math-2',
      '/community/welcome',
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy();
      await page.screenshot({
        path: path.join(
          shots,
          `${route === '/' ? 'home' : route.replaceAll('/', '-')}-${width}.png`,
        ),
        fullPage: true,
      });
    }
  }
});
test('signup persists a student-only account, join request and logout', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('اسمك', { exact: true }).fill('طالب اختبار جديد');
  await page.locator('[name=gender]').selectOption('male');
  await page
    .getByLabel('البريد الإلكتروني الجامعي', { exact: true })
    .fill(`signup-${Date.now()}@example.test`);
  const signupPassword = crypto.randomUUID() + 'A!';
  await page.locator('input[name=password]').fill(signupPassword);
  await page.locator('input[name=confirmPassword]').fill(signupPassword);
  await page.getByLabel('الجامعة', { exact: true }).selectOption('demo-university');
  await page.getByLabel('الكلية', { exact: true }).selectOption('demo-computing');
  await page.locator('input[type=checkbox]').check();
  await page.getByRole('button', { name: 'إنشاء حساب' }).click();
  await expect(page).toHaveURL(/\/(account|courses\/[^/?]+|admin\?tab=institutions)$/);
  await expect(page).toHaveURL(/\/courses\/[^/?]+$/);
  await page.goto('/account?view=student');
  await expect(page.locator('.membership-faculty')).toBeVisible();
  await expect(page.getByText('حالة عضويتك: قيد المراجعة')).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'هذه المساحة لفريق الإدارة.' })).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login$/);
});
test('active resources work but cross-university content is protected', async ({ page }) => {
  await login(page);
  await page.goto('/courses/math-2');
  await page.getByText('المحاضرة الأولى: مقدمة في المعادلات التفاضلية', { exact: true }).click();
  await expect(page.getByText('المعادلة التفاضلية تربط', { exact: false })).toBeVisible();
  await page.screenshot({ path: path.join(shots, 'academic-desktop.png'), fullPage: true });
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/account', '/courses/math-2']) {
      await page.goto(route);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy();
      await page.screenshot({
        path: path.join(shots, `${route.replaceAll('/', '-')}-active-${width}.png`),
        fullPage: true,
      });
    }
  }
  await page.goto('/courses/other-course');
  await expect(page.locator('body')).not.toContainText('OTHER_SCOPE_SECRET_RESOURCE_BODY');
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'هذه المساحة لفريق الإدارة.' })).toBeVisible();
});
test('pending account stays locked', async ({ page }) => {
  await login(page, 'locked');
  await page.goto('/courses/math-2');
  await expect(page.getByRole('heading', { name: 'هذه الصفحة غير موجودة.' })).toBeVisible();
});
test('admin manages content, scope, resources and memberships', async ({ page, browser }) => {
  await login(page, 'admin');
  await page.goto('/admin?tab=courses');
  await expect(page.locator('main')).not.toContainText('مقرر مجتمع آخر');
  await page.goto('/admin?tab=courses&new=1');
  await page.getByLabel('اسم المقرر', { exact: true }).fill('مقرر اختبار إدارة المحتوى');
  await page.getByLabel('كود المقرر', { exact: true }).fill('TEST-101');
  await page.getByLabel('اسم دكتور المقرر', { exact: true }).fill('فريق الاختبار');
  await page
    .getByLabel('وصف المقرر', { exact: true })
    .fill('وصف تفصيلي لاختبار حفظ المقررات وإدارتها.');
  await page.getByRole('checkbox').check();
  const actionRequest = page.waitForRequest(
    (r) => r.method() === 'POST' && !!r.headers()['next-action'],
  );
  await page.getByRole('button', { name: 'حفظ التغييرات' }).click();
  const captured = await actionRequest;
  await expect(page.getByText('تم حفظ المقرر.', { exact: true })).toBeVisible();
  // Replay the exact admin mutation as an ordinary student. The server must deny it.
  const ctx = await browser.newContext();
  const studentPage = await ctx.newPage();
  await login(studentPage);
  const response = await ctx.request.post(captured.url(), {
    headers: {
      'next-action': captured.headers()['next-action'],
      'content-type': captured.headers()['content-type'],
      origin: 'http://localhost:3000',
    },
    data: captured.postDataBuffer()!,
  });
  await expect(await response.text()).toContain('تعذر حفظ');
  await ctx.close();
  await page.goto('/admin?tab=resources&new=1');
  await page.getByLabel('عنوان المورد', { exact: true }).fill('مذكرة اختبار الحفظ');
  await page
    .getByLabel('المحتوى النصي', { exact: true })
    .fill('هذا محتوى نصي توضيحي طويل بما يكفي لاختبار الحفظ.');
  await page.getByRole('button', { name: 'حفظ التغييرات' }).click();
  await expect(page.getByText('تم حفظ المورد،', { exact: false })).toBeVisible();
  await page.goto('/admin?tab=posts&new=1');
  await page.getByLabel('العنوان', { exact: true }).fill('خبر اختبار لوحة الإدارة');
  await page.getByLabel('التصنيف', { exact: true }).selectOption('أخبار المجتمع');
  await page.getByLabel('مقدمة قصيرة', { exact: true }).fill('مقدمة توضيحية لاختبار نشر الأخبار.');
  await page
    .getByLabel('المحتوى', { exact: true })
    .fill('نص الخبر التجريبي لاختبار إدارة المحتوى والنشر في المجتمع.');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'حفظ التغييرات' }).click();
  await expect(page.getByText('تم حفظ المحتوى.', { exact: true })).toBeVisible();
  await page.goto('/admin?tab=members');
  const row = page.locator('tr').filter({ hasText: accounts.pending.email });
  await row.getByRole('combobox').selectOption('active');
  await row.getByRole('button', { name: 'تأكيد' }).click();
  await expect(row.getByText('تم تحديث حالة العضوية.')).toBeVisible();
  await page.goto('/admin?tab=audit');
  await expect(page.getByText('course.created', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('membership.active', { exact: true }).first()).toBeVisible();
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const tab of [
      'overview',
      'courses',
      'resources',
      'posts',
      'members',
      'audit',
      'courses&new=1',
      'resources&new=1',
      'posts&new=1',
    ]) {
      await page.goto(`/admin?tab=${tab}`);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy();
      await page.screenshot({
        path: path.join(shots, `admin-${tab}-${width}.png`),
        fullPage: true,
      });
    }
  }
});
test('editor cannot moderate members or view another university editor form', async ({ page }) => {
  await login(page, 'editor');
  await page.goto('/admin?tab=members');
  await expect(page.getByRole('heading', { name: 'صلاحية غير متاحة' })).toBeVisible();
  await page.goto('/admin?tab=courses&edit=other-course');
  await expect(page.getByText('المقرر غير موجود في نطاقك.')).toBeVisible();
});
