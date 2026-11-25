import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
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
  await expect(page).toHaveURL(/\/(account|courses\/[^/?]+|agent|admin\?tab=institutions)$/);
}
test.beforeEach(async () => {
  await new Promise((r) => setTimeout(r, 11000));
});

test('editor publishes section, assignment and video; unsafe links are rejected', async ({
  page,
}) => {
  test.setTimeout(180000);
  await login(page, 'admin');

  await page.goto('/admin?tab=resources&new=1');
  await page.locator('select[name=courseId]').selectOption('math-2');
  await page.getByLabel('عنوان المورد', { exact: true }).fill('الوحدة الأولى: التمهيد');
  await page.locator('select[name=kind]').selectOption('section');
  await page.getByRole('button', { name: 'حفظ التغييرات' }).click();
  await expect(page.getByText('تم حفظ المورد،', { exact: false })).toBeVisible();

  await page.goto('/admin?tab=resources&new=1');
  await page.locator('select[name=courseId]').selectOption('math-2');
  await page.getByLabel('عنوان المورد', { exact: true }).fill('واجب اختبار التسليم');
  await page.locator('select[name=kind]').selectOption('assignment');
  await page.getByLabel('موعد التسليم', { exact: false }).fill('2030-03-01T14:30');
  await page
    .getByLabel('المحتوى النصي', { exact: true })
    .fill('حل التمارين من ١ إلى ٥ واكتب خطوات الحل كاملة.');
  await page.getByRole('button', { name: 'حفظ التغييرات' }).click();
  await expect(page.getByText('تم حفظ المورد،', { exact: false })).toBeVisible();

  await page.goto('/admin?tab=resources&new=1');
  await page.locator('select[name=courseId]').selectOption('math-2');
  await page.getByLabel('عنوان المورد', { exact: true }).fill('محاضرة مسجلة مرئية');
  await page.locator('select[name=kind]').selectOption('video');
  await page.getByLabel('رابط خارجي', { exact: false }).fill('https://youtu.be/student-hub-demo');
  await page
    .getByLabel('المحتوى النصي', { exact: true })
    .fill('شاهد التسجيل ثم سجّل أسئلتك للمناقشة.');
  await page.getByRole('button', { name: 'حفظ التغييرات' }).click();
  await expect(page.getByText('تم حفظ المورد،', { exact: false })).toBeVisible();

  // A non-https URL must be rejected before it reaches the page.
  await page.goto('/admin?tab=resources&new=1');
  await page.locator('select[name=courseId]').selectOption('math-2');
  await page.getByLabel('عنوان المورد', { exact: true }).fill('رابط غير آمن');
  await page.locator('select[name=kind]').selectOption('video');
  await page.getByLabel('رابط خارجي', { exact: false }).fill('javascript:alert(1)');
  await page.getByLabel('المحتوى النصي', { exact: true }).fill('محاولة رابط غير آمن يجب أن تُرفض.');
  await page.getByRole('button', { name: 'حفظ التغييرات' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('student submits an assignment and progress skips sections', async ({ browser }) => {
  test.setTimeout(180000);
  const ctx = await browser.newContext();
  const student = await ctx.newPage();
  await login(student, 'student');
  await student.goto('/courses/math-2');
  const tabs = student.locator('.resource-tabs');
  await expect(tabs.getByRole('link', { name: 'الأقسام' })).toBeVisible();
  await expect(tabs.getByRole('link', { name: 'الواجبات' })).toBeVisible();
  await expect(tabs.getByRole('link', { name: 'الفيديو' })).toBeVisible();
  await expect(
    student
      .locator('.resource-section-heading')
      .filter({ hasText: 'الوحدة الأولى: التمهيد' })
      .last(),
  ).toBeVisible();

  // Sections are organizational: the completion tally counts only real resources.
  const countable = await student.locator('.resource-list > details.resource').count();
  await expect(student.locator('.course-progress-card')).toContainText(
    `من ${countable} موارد مكتملة`,
  );

  // The video opens as a plain new-tab link that names its host.
  const video = student
    .locator('details.resource')
    .filter({ hasText: 'محاضرة مسجلة مرئية' })
    .last();
  await video.locator('summary').click();
  const videoLink = video.getByRole('link', { name: /مشاهدة الفيديو/ });
  await expect(videoLink).toHaveAttribute('href', 'https://youtu.be/student-hub-demo');
  await expect(videoLink).toHaveAttribute('target', '_blank');
  await expect(videoLink).toHaveAttribute('rel', /noopener/);
  await expect(videoLink).toContainText('youtu.be');

  // The student submits the assignment and the submission persists.
  const assignment = student
    .locator('details.resource')
    .filter({ hasText: 'واجب اختبار التسليم' })
    .last();
  await assignment.locator('summary').click();
  await expect(assignment).toContainText('موعد التسليم');
  await assignment
    .locator('textarea[name=body]')
    .fill('إجابتي: الحلول مرفقة خطوة بخطوة في المستند.');
  await assignment.locator('input[name=url]').fill('https://drive.google.com/file/d/demo-answer');
  await assignment.getByRole('button', { name: 'تسليم الواجب' }).click();
  await expect(assignment.getByText('سُجّلت إجابتك،', { exact: false })).toBeVisible();
  await student.reload();
  const reopened = student
    .locator('details.resource')
    .filter({ hasText: 'واجب اختبار التسليم' })
    .last();
  await expect(reopened.locator('summary')).toContainText('تم التسليم');
  await reopened.locator('summary').click();
  await expect(reopened.locator('textarea[name=body]')).toHaveValue(
    'إجابتي: الحلول مرفقة خطوة بخطوة في المستند.',
  );

  await student.screenshot({
    path: test.info().outputPath('course-expansion-1440.png'),
    fullPage: true,
  });
  await student.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => student.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await student.screenshot({
    path: test.info().outputPath('course-expansion-390.png'),
    fullPage: true,
  });
  await student.evaluate(() => {
    localStorage.setItem('hub-theme', 'dark');
    window.dispatchEvent(new Event('hub-theme-change'));
  });
  for (const width of [1280, 390, 320]) {
    await student.setViewportSize({ width, height: 940 });
    await expect(student.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect
      .poll(() => student.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    const check = await new AxeBuilder({ page: student })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      check.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([]);
    await reopened.screenshot({
      path: test.info().outputPath(`assignment-expanded-dark-${width}.png`),
    });
  }
  await ctx.close();
});
