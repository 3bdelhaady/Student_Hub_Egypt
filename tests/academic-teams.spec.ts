import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
const course = 'team-fixture-course-a';
const main = '/services?kind=team&course=' + course;
async function login(page: Page, key = 'demostudent') {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function ready(page: Page) {
  await page.mouse.move(0, 0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    await new Promise(requestAnimationFrame);
  });
}
async function proposal(page: Page, title: string) {
  await page.goto('/services/new-team?course=' + course);
  await page.locator('[name=title]').fill(title);
  await page
    .locator('textarea[name=description]')
    .fill('مشروع اختبار محلي لإنشاء فريق، لا يمثل طلبًا إنتاجيًا أو أعضاء حقيقيين.');
  await expect(page.locator('[name=marker]')).toHaveCount(0);
}
async function chooseForgedCourse(page: Page, id: string) {
  await page.locator('select[name=courseId]').evaluate((e, id) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = 'forged local test';
    e.append(option);
  }, id);
  await page.locator('select[name=courseId]').selectOption(id);
}
test('team creation denies real wrong-scope/draft course IDs, preserves input, persists a distinct private proposal and rejects a stale duplicate', async ({
  page,
  browser,
}) => {
  await login(page);
  const title = 'فريق مقترح محلي ' + Date.now();
  await proposal(page, title);
  for (const id of ['other-course', 'draft-course']) {
    await chooseForgedCourse(page, id);
    await page.getByRole('button', { name: 'إرسال طلب إنشاء فريق', exact: true }).click();
    await expect(page.locator('.academic-team-creation-form [role=alert]')).toContainText(
      'تعذر إرسال الطلب',
    );
    await expect(page.locator('[name=title]')).toHaveValue(title);
    await expect(page.locator('[name=marker]')).toHaveCount(0);
  }
  await page.locator('select[name=courseId]').selectOption(course);
  const stale = await page.context().newPage();
  await proposal(stale, title);
  await page.getByRole('button', { name: 'إرسال طلب إنشاء فريق', exact: true }).click();
  await expect(page).toHaveURL(/services\?kind=team&course=/);
  await page.goto('/requests');
  await page.getByRole('link').filter({ hasText: title }).first().click();
  const requestUrl = page.url();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByText('المقرر عند إرسال الطلب:', { exact: false })).toContainText(
    'مقرر اختبار الفرق الأول',
  );
  await expect(page.getByText('إنشاء فريق أكاديمي', { exact: true })).toBeVisible();
  await stale.getByRole('button', { name: 'إرسال طلب إنشاء فريق', exact: true }).click();
  await expect(stale.locator('.academic-team-creation-form [role=alert]')).toContainText(
    'تعذر إرسال الطلب',
  );
  await stale.close();
  await page.goto(main);
  await expect(page.locator('.academic-team-request-list')).toContainText(title);
  await page.goto('/requests');
  await expect(page.getByRole('link').filter({ hasText: title })).toContainText(
    'طلب إنشاء فريق أكاديمي',
  );
  const other = await browser.newContext();
  const outsider = await other.newPage();
  await login(outsider, 'student');
  await outsider.goto(requestUrl);
  await expect(outsider.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  await other.close();
});
test('team join rejects closed, draft, wrong-faculty and unpublished-course entries, then persists and cancels one real request', async ({
  page,
}) => {
  await login(page);
  for (const target of ['closed', 'draft', 'hidden', 'unavailable-course']) {
    await page.goto('/services/team-fixture-open-a');
    const form = page.locator('#team-apply form').filter({ has: page.locator('[name=subject]') });
    await form.locator('[name=body]').fill('طلب انضمام اصطناعي للتحقق من حماية النطاق والإغلاق.');
    await form
      .locator('[name=entryId]')
      .evaluate((e, id) => ((e as HTMLInputElement).value = id), 'team-fixture-' + target);
    await form.getByRole('button', { name: 'إرسال الطلب للمراجعة' }).click();
    await expect(form.getByRole('alert')).toContainText('تعذر إرسال الطلب');
    await page.goto('/services/team-fixture-' + target);
    if (target === 'closed')
      await expect(page.getByText('التقديم مغلق حاليًا،', { exact: false })).toBeVisible();
    else
      await expect(
        page.getByRole('heading', { name: 'فريق اختبار محلي ' + target, exact: true }),
      ).toHaveCount(0);
  }
  await page.goto('/services/team-fixture-open-a');
  await page
    .locator('#team-apply textarea[name=body]')
    .fill('طلب انضمام محلي حقيقي في قاعدة اختبار، دون أي التزام خارجي.');
  await page.getByRole('button', { name: 'إرسال الطلب للمراجعة', exact: true }).click();
  await expect(page.getByRole('link', { name: 'متابعة طلبك الحالي', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'متابعة طلبك الحالي', exact: true }).click();
  await expect(page.getByRole('button', { name: 'إلغاء طلبي', exact: true })).toHaveCount(0);
});
test('team main, course selection, pagination, saving, search and 24 responsive guest/student states are accessible', async ({
  page,
}, info) => {
  await page.goto('/services/new-team');
  await expect(page).toHaveURL(/\/login\?next=/);
  await login(page);
  await page.goto(main);
  await expect(
    page
      .getByRole('region', { name: 'الفرق المتاحة للمقرر', exact: true })
      .getByRole('heading', { name: 'فريق اختبار محلي open-a', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'فريق اختبار محلي hidden', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'فريق اختبار محلي unavailable-course', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'الفرق التالية', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'فريق اختبار محلي closed', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'الفرق السابقة', exact: true }).click();
  await page.getByRole('link', { name: /مقرر اختبار الفرق الثاني/ }).click();
  await expect(
    page.getByRole('heading', { name: 'فريق اختبار محلي second', exact: true }),
  ).toBeVisible();
  await page.goto('/services/team-fixture-open-a');
  const saved = page.getByRole('button', { name: 'حفظ في قائمتي', exact: true });
  if (await saved.count()) await saved.click();
  await expect(page.getByRole('button', { name: 'إزالة من المحفوظات', exact: true })).toBeVisible();
  await page.goto(main + '&saved=1');
  await expect(
    page
      .getByRole('region', { name: 'الفرق المتاحة للمقرر', exact: true })
      .getByRole('heading', { name: 'فريق اختبار محلي open-a', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'فريق اختبار محلي open-b', exact: true }),
  ).toHaveCount(0);
  await page.locator('[name=q]').fill('zz-no-local-team-result');
  await page.getByRole('button', { name: 'بحث', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'لا توجد فرق مطابقة لهذا الاختيار', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'مسح الفلاتر', exact: true }).click();
  let states = 0;
  for (const mode of ['student', 'guest']) {
    if (mode === 'guest') {
      await page.context().clearCookies();
      await page.goto('/services?kind=team');
    }
    for (const theme of ['light', 'dark'])
      for (const width of [1280, 390, 320]) {
        await page.setViewportSize({ width, height: 980 });
        await page.evaluate((theme) => localStorage.setItem('hub-theme', theme), theme);
        const routes =
          mode === 'student'
            ? [main, '/services/new-team?course=' + course, '/services/team-fixture-open-a']
            : ['/services?kind=team'];
        for (const [index, url] of routes.entries()) {
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
            path: info.outputPath(`teams-${mode}-${theme}-${width}-${index}.png`),
            fullPage: true,
          });
          states++;
        }
      }
  }
  expect(states).toBe(24);
});
test('stale team-creation forms reject pending membership and agent mode without changing existing accounts', async ({
  page,
}) => {
  await login(page);
  await proposal(page, 'طلب محلي مرفوض للصلاحيات ' + Date.now());
  const switcher = await page.context().newPage();
  await switcher.goto('/settings');
  await switcher.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login(switcher, 'locked');
  await page.getByRole('button', { name: 'إرسال طلب إنشاء فريق', exact: true }).click();
  await expect(page.locator('.academic-team-creation-form [role=alert]')).toContainText(
    'تعذر إرسال الطلب',
  );
  await switcher.goto('/settings');
  await switcher.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login(switcher, 'welfare');
  await page.getByRole('button', { name: 'إرسال طلب إنشاء فريق', exact: true }).click();
  await expect(page).toHaveURL(/\/agent/);
  await switcher.close();
});

test('team management validates real course scope and stale save/join forms stop when the linked course is unpublished', async ({
  page,
  browser,
}) => {
  await login(page, 'admin');
  await page.goto('/manage?edit=team-fixture-open-b');
  await expect(page.locator('select[name=teamCourseId],[name=teamMarker]')).toHaveCount(0);
  await page.locator('textarea[name=description]').fill('وصف الفريق بعد التعديل المسموح فقط');
  await page
    .locator('form')
    .filter({ has: page.locator('textarea[name=description]') })
    .evaluate((f) => {
      const i = document.createElement('input');
      i.type = 'hidden';
      i.name = 'teamCourseId';
      i.value = 'other-course';
      f.append(i);
    });
  await page.getByRole('button', { name: 'حفظ الوصف', exact: true }).click();
  await expect(page.locator('form [role=status]')).toContainText('تم حفظ');
  await page.reload();
  await expect(page.locator('textarea[name=description]')).toHaveValue(
    'وصف الفريق بعد التعديل المسموح فقط',
  );
  await expect(
    page.getByRole('link', { name: 'تحميل بيانات الفريق CSV', exact: true }),
  ).toHaveAttribute('href', new RegExp('course=' + course));
  const context = await browser.newContext();
  const student = await context.newPage();
  await login(student);
  await student.goto('/services/team-fixture-second');
  const saveForm = student
    .locator('form')
    .filter({ has: student.getByRole('button', { name: /حفظ في قائمتي|إزالة من المحفوظات/ }) });
  const joinForm = student
    .locator('#team-apply form')
    .filter({ has: student.locator('[name=subject]') });
  await joinForm
    .locator('[name=body]')
    .fill('نموذج محلي قديم للتحقق من منع التقديم بعد إلغاء نشر المقرر.');
  await page.goto('/admin?tab=courses&edit=team-fixture-course-b');
  await page.locator('[name=code]').fill('TEAM-B');
  await page.locator('[name=published]').uncheck();
  await page
    .locator('form')
    .filter({ has: page.locator('[name=instructor]') })
    .getByRole('button', { name: 'حفظ التغييرات', exact: true })
    .click();
  await expect(page.locator('form [role=status]')).toContainText('تم حفظ المقرر');
  await saveForm.getByRole('button').click();
  await expect(saveForm.getByRole('alert')).toContainText('تعذر حفظ التغييرات');
  await joinForm.getByRole('button', { name: 'إرسال الطلب للمراجعة', exact: true }).click();
  await expect(joinForm.getByRole('alert')).toContainText('تعذر إرسال الطلب');
  await student.goto('/services/team-fixture-second');
  await expect(
    student.getByRole('heading', { name: 'فريق اختبار محلي second', exact: true }),
  ).toHaveCount(0);
  await page.goto('/manage?edit=team-fixture-second');
  await expect(
    page.getByRole('heading', { name: 'هذه الصفحة غير موجودة.', exact: true }),
  ).toBeVisible();
  await page.goto('/admin?tab=courses&edit=team-fixture-course-b');
  await page.locator('[name=published]').check();
  await page
    .locator('form')
    .filter({ has: page.locator('[name=instructor]') })
    .getByRole('button', { name: 'حفظ التغييرات', exact: true })
    .click();
  await expect(page.locator('form [role=status]')).toContainText('تم حفظ المقرر');
  await student.goto('/services/team-fixture-second');
  await expect(
    student.getByRole('heading', { name: 'فريق اختبار محلي second', exact: true }),
  ).toBeVisible();
  await context.close();
});
