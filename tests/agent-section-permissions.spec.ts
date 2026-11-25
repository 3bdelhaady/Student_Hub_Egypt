import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(p: Page, key: string) {
  await p.waitForTimeout(11000);
  await p.goto('/login');
  await p.locator('[name=email]').fill(accounts[key].email);
  await p.locator('[name=password]').fill(accounts[key].password);
  await p.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(p).not.toHaveURL(/\/login/);
}
async function denied(p: Page, url: string) {
  await p.goto(url);
  await expect(
    p.getByRole('heading', { name: 'هذه الصفحة غير موجودة.', exact: true }),
  ).toBeVisible();
}
async function ready(p: Page) {
  await p.mouse.move(0, 0);
  await p.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });
}
const target = '/admin?tab=agents&edit=section-fixture-agent-sectionwriter';
test('eight named rows persist independent permissions and old/global or invalid permission forms fail closed', async ({
  page,
}) => {
  await login(page, 'demoadmin');
  await page.goto(target);
  const form = page.locator('.console-agent-detail form');
  await expect(form.locator('.section-permission-row')).toHaveCount(8);
  await expect(form.locator('[name=canRead]')).toHaveCount(0);
  await expect(form.getByRole('group', { name: 'رابط الطلاب', exact: true })).toBeVisible();
  await expect(
    form.getByRole('group', { name: 'مساحة العمل الأكاديمية', exact: true }),
  ).toBeVisible();
  await form.locator('[name="poll.canPublish"]').check();
  await form.getByRole('button', { name: 'تأكيد الصلاحيات', exact: true }).click();
  await expect(form.getByRole('alert')).toBeVisible();
  await form.locator('[name="poll.canPublish"]').uncheck();
  await page.route('**/admin?tab=agents*', async (route) => {
    const r = route.request(),
      data = r.postData();
    if (r.method() === 'POST' && data?.includes('sectionPermissionsVersion'))
      return route.continue({
        postData: data.replace('sectionPermissionsVersion', 'oldPermissionVersion'),
      });
    return route.continue();
  });
  await form.getByRole('button', { name: 'تأكيد الصلاحيات', exact: true }).click();
  await expect(form.getByRole('alert')).toBeVisible();
  await page.unroute('**/admin?tab=agents*');
  await form.getByRole('button', { name: 'تأكيد الصلاحيات', exact: true }).click();
  await expect(form.getByRole('status')).toContainText('تم حفظ');
  await page.reload();
  await expect(form.locator('[name="ticket.canEdit"]')).toBeChecked();
  await expect(form.locator('[name="ticket.canPublish"]')).not.toBeChecked();
  await expect(form.locator('[name="poll.canRead"]')).not.toBeChecked();
  await expect(form.locator('[name="academic.canPublish"]')).toBeChecked();
});
test('service rows guard real reading editing publishing and forged section IDs', async ({
  page,
}) => {
  await login(page, 'sectionwriter');
  await page.goto('/manage');
  const nav = page.getByRole('navigation', { name: 'أقسام الخدمات للإدارة' });
  await expect(nav.getByRole('link')).toHaveCount(1);
  await expect(nav.getByRole('link', { name: 'التذاكر الإلكترونية' })).toBeVisible();
  await expect(page.getByText('خدمة نطاق محلية trip', { exact: true })).toHaveCount(0);
  await denied(page, '/manage?kind=trip');
  await page.goto('/manage?edit=section-fixture-ticket');
  await expect(page.locator('[name=published]')).toBeDisabled();
  await page.locator('[name=title]').fill('خدمة نطاق محلية ticket');
  await page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.route('**/manage?edit=*', async (route) => {
    const r = route.request(),
      data = r.postData();
    if (r.method() === 'POST' && data)
      return route.continue({
        postData: data
          .replaceAll('section-fixture-ticket', 'section-fixture-trip')
          .replaceAll('"ticket"', '"training"'),
      });
    return route.continue();
  });
  await page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  await expect(page.locator('.form-error[role=alert]')).toBeVisible();
  await page.unroute('**/manage?edit=*');
  // A forged publish flag remains denied even though the draft edit permission is valid.
  await page.locator('[name=published]').evaluate((e) => {
    (e as HTMLInputElement).disabled = false;
  });
  await page.locator('[name=published]').check();
  await page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  await expect(page.locator('.form-error[role=alert]')).toBeVisible();
});
test('academic scope supports actual course and resource changes without inheriting legacy or foreign course rights', async ({
  page,
  browser,
}) => {
  await login(page, 'sectionwriter');
  await page.goto('/manage/academic');
  await expect(
    page.getByRole('heading', { name: 'مقرر نطاق محلي own', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('مقرر نطاق محلي foreign', { exact: true })).toHaveCount(0);
  await denied(page, '/manage/academic?course=section-fixture-course-foreign');
  await page.goto('/manage/academic?course=math-2');
  await expect(page.getByRole('heading', { name: 'الرياضيات ٢', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'إضافة مقرر', exact: true })).toHaveCount(0);
  await denied(page, '/manage/academic?new=1');
  await page.goto('/manage/academic?course=section-fixture-course-own');
  await expect(page.getByRole('heading', { name: 'تعديل بيانات المقرر', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole('link', { name: 'الخدمات والطلبات', exact: true })).toHaveCount(0);
  const affairsContext = await browser.newContext();
  const affairsPage = await affairsContext.newPage();
  await login(affairsPage, 'demoagent');
  await affairsPage.goto('/manage/academic?course=section-fixture-course-own');
  await affairsPage.locator('[name=code]').fill('SCOPE-101');
  const courseRequest = affairsPage.waitForRequest(
    (r) => r.method() === 'POST' && !!r.headers()['next-action'],
  );
  await affairsPage.getByRole('button', { name: 'حفظ التغييرات', exact: true }).click();
  await expect(affairsPage.getByRole('status')).toContainText('تم حفظ المقرر');
  const editCourse = await courseRequest;
  for (const data of [
    editCourse.postData()!,
    editCourse.postData()!.replaceAll('section-fixture-course-own', ''),
  ]) {
    const replay = await page.context().request.post(editCourse.url(), {
      headers: {
        'next-action': editCourse.headers()['next-action'],
        'content-type': editCourse.headers()['content-type'],
        origin: 'http://localhost:3000',
      },
      data,
    });
    expect(await replay.text()).toContain('تعذر');
  }
  await affairsContext.close();
  await page.goto('/manage/academic?course=section-fixture-course-own&resource=new');
  await page.locator('[name=title]').fill('مورد وكيل محلي جديد');
  await page.locator('[name=body]').fill('محتوى اصطناعي للتحقق من إضافة مورد تعليمي فعلي.');
  const requestPromise = page.waitForRequest(
    (r) => r.method() === 'POST' && !!r.headers()['next-action'],
  );
  await page.getByRole('button', { name: 'حفظ التغييرات', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ المورد');
  const captured = await requestPromise;
  await page.goto('/manage/academic?course=section-fixture-course-own');
  await page
    .getByRole('article')
    .filter({ hasText: 'مورد وكيل محلي جديد' })
    .getByRole('link')
    .click();
  await expect(page).toHaveURL(/resource=/);
  await page.locator('[name=deleteConsent]').check();
  await page.getByRole('button', { name: 'حذف المورد', exact: true }).click();
  await expect(page).toHaveURL(/course=section-fixture-course-own$/);
  await expect(page.getByRole('heading', { name: 'مورد وكيل محلي جديد', exact: true })).toHaveCount(
    0,
  );
  const ctx = await browser.newContext(),
    reader = await ctx.newPage();
  await login(reader, 'sectionreader');
  const replay = await ctx.request.post(captured.url(), {
    headers: {
      'next-action': captured.headers()['next-action'],
      'content-type': captured.headers()['content-type'],
      origin: 'http://localhost:3000',
    },
    data: captured.postDataBuffer()!,
  });
  expect(await replay.text()).toContain('تعذر');
  for (const foreign of ['section-fixture-course-foreign']) {
    const result = await page.context().request.post(captured.url(), {
      headers: {
        'next-action': captured.headers()['next-action'],
        'content-type': captured.headers()['content-type'],
        origin: 'http://localhost:3000',
      },
      data: captured.postData()!.replaceAll('section-fixture-course-own', foreign),
    });
    expect(await result.text()).toContain('تعذر');
  }
  await reader.goto('/manage/academic?course=section-fixture-course-own');
  await expect(
    reader.getByRole('heading', { name: 'مورد اختبار نطاق own', exact: true }),
  ).toBeVisible();
  await expect(reader.getByRole('link', { name: 'إضافة مورد', exact: true })).toHaveCount(0);
  await denied(reader, '/manage/academic?course=section-fixture-course-own&resource=new');
  await ctx.close();
});
test('published scoped resources stay faculty private across catalog direct views saves and stale permission forms', async ({
  page,
  browser,
}) => {
  await login(page, 'demostudent');
  await page.goto('/courses?view=catalog');
  await expect(
    page.getByRole('heading', { name: 'مقرر نطاق محلي own', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'مقرر نطاق محلي foreign', exact: true }),
  ).toHaveCount(0);
  await page.goto('/courses/section-fixture-course-own');
  await expect(page.getByText('مورد اختبار نطاق own', { exact: true })).toBeVisible();
  await denied(page, '/courses/section-fixture-course-foreign');
  const writerCtx = await browser.newContext(),
    writer = await writerCtx.newPage();
  await login(writer, 'sectionwriter');
  await writer.goto('/manage/academic?course=section-fixture-course-own&resource=new');
  await writer.locator('[name=title]').fill('مورد لا يجب حفظه');
  await writer
    .locator('[name=body]')
    .fill('اختبار نموذج قديم بعد إلغاء إذن النشر في المقرر المنشور.');
  const adminCtx = await browser.newContext(),
    admin = await adminCtx.newPage();
  await login(admin, 'demoadmin');
  await admin.goto(target);
  const form = admin.locator('.console-agent-detail form');
  await form.locator('[name="academic.canPublish"]').uncheck();
  await form.getByRole('button', { name: 'تأكيد الصلاحيات', exact: true }).click();
  await expect(form.getByRole('status')).toBeVisible();
  await writer.getByRole('button', { name: 'حفظ التغييرات', exact: true }).click();
  await expect(writer.locator('.form-error[role=alert]')).toBeVisible();
  await form.locator('[name="academic.canPublish"]').check();
  await form.getByRole('button', { name: 'تأكيد الصلاحيات', exact: true }).click();
  await expect(form.getByRole('status')).toBeVisible();
  await writerCtx.close();
  await adminCtx.close();
});
test('legacy editors retain old courses but cannot take or move scoped academic resources', async ({
  page,
}) => {
  await login(page, 'editor');
  await page.goto('/admin?tab=resources');
  await expect(page.getByText('مورد اختبار نطاق own', { exact: true })).toHaveCount(0);
  const edit = page.locator('a[href*="/admin?tab=resources&edit="]').first();
  await edit.click();
  const id = await page.locator('form [name=id]').inputValue();
  const requestPromise = page.waitForRequest(
    (r) => r.method() === 'POST' && !!r.headers()['next-action'],
  );
  await page.getByRole('button', { name: 'حفظ التغييرات', exact: true }).click();
  const captured = await requestPromise;
  await expect(page.getByRole('status')).toBeVisible();
  const result = await page.context().request.post(captured.url(), {
    headers: {
      'next-action': captured.headers()['next-action'],
      'content-type': captured.headers()['content-type'],
      origin: 'http://localhost:3000',
    },
    data: captured.postData()!.replaceAll(id, 'section-fixture-resource-own'),
  });
  expect(await result.text()).toContain('تعذر');
});
test('named permission rows and real academic workspace are readable in responsive light and dark states', async ({
  page,
}, info) => {
  await login(page, 'demoadmin');
  let states = 0;
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 980 });
      await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
      for (const [i, url] of [
        target,
        '/manage/academic?course=section-fixture-course-own',
      ].entries()) {
        await page.goto(url);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await ready(page);
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          .toBe(true);
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(result.violations, JSON.stringify(result.violations)).toEqual([]);
        await page.screenshot({
          path: info.outputPath(`section-${theme}-${width}-${i}.png`),
          fullPage: true,
        });
        states++;
      }
    }
  await page.context().clearCookies();
  await login(page, 'sectionwriter');
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 980 });
      await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
      for (const [i, url] of [
        '/manage/academic?course=section-fixture-course-own',
        '/manage/academic?course=section-fixture-course-own&resource=new',
      ].entries()) {
        await page.goto(url);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await ready(page);
        if (theme === 'dark')
          await expect(page.locator('.affairs-workspace')).toHaveCSS(
            'background-color',
            'rgb(20, 45, 57)',
          );
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          .toBe(true);
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(result.violations, JSON.stringify(result.violations)).toEqual([]);
        await page.screenshot({
          path: info.outputPath(`agent-${theme}-${width}-${i}.png`),
          fullPage: true,
        });
        states++;
      }
    }
  expect(states).toBe(24);
});
