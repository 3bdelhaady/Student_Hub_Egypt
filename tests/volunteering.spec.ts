import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
const main = '/services?kind=volunteer&volunteer=volunteer-fixture-a';
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
async function saveManagement(page: Page) {
  const button = page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار', exact: true });
  await button.click();
  await expect(button).toBeEnabled();
}
async function fillApplication(page: Page) {
  const form = page.locator('.volunteer-application-form');
  await form.getByRole('radio').first().check();
  await form.locator('[name=notes]').fill('طلب تطوع اصطناعي محلي لفحص القسم الصحيح وحماية الطلب.');
  await form.locator('[name=applicationConsent]').check();
  return form;
}
test('volunteer applications reject forged real division/scope/lifecycle IDs, then persist a private choice and prevent duplicate application', async ({
  page,
  browser,
}) => {
  await login(page);
  for (const [entry, division] of [
    ['a', 'volunteer-fixture-b-division'],
    ['a', 'volunteer-fixture-a-inactive'],
    ...['full', 'expired', 'hidden', 'draft', 'inactive'].map((v) => [
      v,
      'volunteer-fixture-' + v + '-division',
    ]),
  ]) {
    await page.goto(main);
    const form = await fillApplication(page);
    await form
      .locator('[name=entryId]')
      .evaluate((e, id) => ((e as HTMLInputElement).value = id), 'volunteer-fixture-' + entry);
    await form
      .getByRole('radio')
      .first()
      .evaluate((e, id) => ((e as HTMLInputElement).value = id), division);
    await form.getByRole('button', { name: 'تقديم الطلب', exact: true }).click();
    await expect(form.getByRole('alert')).toContainText('تعذر إرسال الطلب');
    await expect(form.locator('[name=notes]')).toHaveValue(
      'طلب تطوع اصطناعي محلي لفحص القسم الصحيح وحماية الطلب.',
    );
  }
  await page.goto(main);
  const form = await fillApplication(page);
  const stale = await page.context().newPage();
  await stale.goto(main);
  await fillApplication(stale);
  await form.getByRole('button', { name: 'تقديم الطلب', exact: true }).click();
  await expect(page.getByRole('link', { name: 'متابعة طلبك الحالي', exact: true })).toBeVisible();
  await stale.getByRole('button', { name: 'تقديم الطلب', exact: true }).click();
  await expect(stale.locator('.volunteer-application-form [role=alert]')).toContainText(
    'تعذر إرسال الطلب',
  );
  await stale.close();
  await page.getByRole('link', { name: 'متابعة طلبك الحالي', exact: true }).click();
  await expect(page).toHaveURL(/\/requests\//);
  const requestUrl = page.url();
  await expect(
    page.getByText('قسم التطوع عند إرسال الطلب: قسم التنظيم المحلي', { exact: true }),
  ).toBeVisible();
  const context = await browser.newContext();
  const other = await context.newPage();
  await login(other, 'student');
  await other.goto(requestUrl);
  await expect(
    other.getByRole('heading', { name: 'هذه الصفحة غير موجودة.', exact: true }),
  ).toBeVisible();
  await expect(
    other.getByRole('heading', { name: 'فرصة تطوع اختبار محلية a', exact: true }),
  ).toHaveCount(0);
  await context.close();
  await expect(page.getByRole('button', { name: 'إلغاء طلبي', exact: true })).toHaveCount(0);
});
test('volunteer division management preserves stable IDs, rejects a foreign division and keeps private historical labels after removal', async ({
  page,
  browser,
}) => {
  await login(page, 'admin');
  await page.goto('/manage?edit=volunteer-fixture-b');
  const data = page.locator('[name=volunteerDivisions]');
  const original = JSON.parse(await data.inputValue());
  await data.evaluate(
    (e) =>
      ((e as HTMLInputElement).value = JSON.stringify([
        {
          id: 'volunteer-fixture-a-division',
          label: 'قسم مزور محلي',
          description: '',
          active: true,
        },
      ])),
  );
  await saveManagement(page);
  await expect(page.locator('form [role=alert]')).toContainText('تعذر الحفظ');
  await page.reload();
  await page
    .locator('.volunteer-division-editor textarea')
    .first()
    .fill('وصف محلي محدث دون تغيير معرف القسم.');
  await saveManagement(page);
  await expect(page.locator('form [role=status]')).toContainText('تم حفظ الخدمة');
  expect(JSON.parse(await data.inputValue())[0].id).toBe(original[0].id);
  const context = await browser.newContext();
  const student = await context.newPage();
  await login(student);
  await student.goto('/services?kind=volunteer&volunteer=volunteer-fixture-b');
  const stale = await fillApplication(student);
  await page.getByRole('button', { name: 'حذف القسم 1', exact: true }).click();
  await saveManagement(page);
  await expect(page.locator('form [role=status]')).toContainText('تم حفظ الخدمة');
  await stale.getByRole('button', { name: 'تقديم الطلب', exact: true }).click();
  await expect(stale.getByRole('alert')).toContainText('تعذر إرسال الطلب');
  await student.goto('/requests/volunteer-fixture-history');
  await expect(
    student.getByText('قسم التطوع عند إرسال الطلب: قسم التواصل المحلي', { exact: true }),
  ).toBeVisible();
  await student.goto('/services?kind=volunteer&volunteer=volunteer-fixture-b');
  await expect(
    student.getByRole('heading', { name: 'لم تحدد الجهة أقسامًا متاحة بعد', exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'إضافة قسم تطوع', exact: true }).click();
  await page
    .locator('.volunteer-division-editor input:not([type=hidden]):not([type=checkbox])')
    .fill('قسم محلي جديد');
  await saveManagement(page);
  await expect(page.locator('form [role=status]')).toContainText('تم حفظ الخدمة');
  const newId = JSON.parse(await data.inputValue())[0].id;
  expect(newId).toBeTruthy();
  expect(newId).not.toBe(original[0].id);
  await saveManagement(page);
  await expect(page.locator('form [role=status]')).toContainText('تم حفظ الخدمة');
  expect(JSON.parse(await data.inputValue())[0].id).toBe(newId);
  await context.close();
});
test('volunteer selection, pagination, search and saved filters work in 24 readable responsive guest/student states', async ({
  page,
}, info) => {
  await login(page, 'student');
  await page.goto(main + '&category=' + encodeURIComponent('اختبار محلي للتطوع'));
  await expect(page.getByRole('radio', { name: /قسم التنظيم المحلي/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: /قسم محلي غير متاح/ })).toHaveCount(0);
  await page.getByRole('link', { name: 'الفرص التالية', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'لم تحدد الجهة أقسامًا متاحة بعد', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'الفرص السابقة', exact: true }).click();
  await page.goto('/services/volunteer-fixture-a');
  await expect(
    page.getByRole('button', { name: /^(حفظ في قائمتي|إزالة من المحفوظات)$/ }),
  ).toBeVisible();
  const save = page.getByRole('button', { name: 'حفظ في قائمتي', exact: true });
  if (await save.count()) await save.click();
  await expect(page.getByRole('button', { name: 'إزالة من المحفوظات', exact: true })).toBeVisible();
  await page.goto(main + '&saved=1');
  await expect(
    page.getByRole('heading', { name: 'فرصة تطوع اختبار محلية a', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'فرصة تطوع اختبار محلية b', exact: true }),
  ).toHaveCount(0);
  await page.locator('[name=q]').fill('zz-no-local-volunteer-result');
  await page.getByRole('button', { name: 'بحث', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'لا توجد فرص تطوع مطابقة', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'مسح الفلاتر', exact: true }).click();
  let states = 0;
  for (const mode of ['student', 'guest']) {
    if (mode === 'guest') {
      await page.context().clearCookies();
      await page.goto(main);
    }
    for (const theme of ['light', 'dark'])
      for (const width of [1280, 390, 320]) {
        await page.setViewportSize({ width, height: 980 });
        await page.evaluate((theme) => localStorage.setItem('hub-theme', theme), theme);
        const routes =
          mode === 'student'
            ? [main, '/services/volunteer-fixture-a', '/services?kind=volunteer&q=zz-no-results']
            : [main, '/services?kind=volunteer&q=zz-no-results'];
        for (const [index, url] of routes.entries()) {
          if (mode === 'guest' && index === 1) continue;
          await page.goto(url);
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          await ready(page);
          await expect
            .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
            .toBe(true);
          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
          expect(results.violations, JSON.stringify(results.violations)).toEqual([]);
          await page.screenshot({
            path: info.outputPath(`volunteer-${mode}-${theme}-${width}-${index}.png`),
            fullPage: true,
          });
          states++;
        }
      }
  }
  expect(states).toBe(24);
});
test('generic request forms cannot bypass division selection and stale application forms deny agent mode', async ({
  page,
}) => {
  await login(page, 'student');
  await page.goto('/services/team-fixture-open-b');
  const generic = page.locator('#team-apply form').filter({ has: page.locator('[name=subject]') });
  await generic.locator('[name=body]').fill('طلب اختبار محلي لمحاولة تجاوز اختيار قسم التطوع.');
  await generic
    .locator('[name=entryId]')
    .evaluate((e) => ((e as HTMLInputElement).value = 'volunteer-fixture-a'));
  await generic.getByRole('button', { name: 'إرسال الطلب للمراجعة', exact: true }).click();
  await expect(generic.getByRole('alert')).toContainText('تعذر إرسال الطلب');
  await page.goto(main);
  await fillApplication(page);
  const switcher = await page.context().newPage();
  await switcher.goto('/settings');
  await switcher.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login(switcher, 'welfare');
  await page.getByRole('button', { name: 'تقديم الطلب', exact: true }).click();
  await expect(page).toHaveURL(/\/agent/);
  await switcher.close();
});
