import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('Student Link groups search details and per-item application review', async ({ page }) => {
  await page.goto('/services?kind=service&q=ديمو:');
  await expect(page.getByRole('heading', { name: 'رابط الطلاب', exact: true })).toBeVisible();
  await expect(page.locator('.student-link-card').filter({ hasText: 'ديمو:' })).toHaveCount(7);
  for (const label of ['الوظائف', 'التدريبات', 'المنح'])
    await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
  await page
    .getByRole('link', { name: /عرض التفاصيل.*ديمو: مطور واجهات مبتدئ/, exact: true })
    .click();
  await expect(page.locator('.student-link-demo-note')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'حفظ للتجربة على هذا الجهاز' })).toHaveCount(0);
  await page
    .locator('.student-link-detail')
    .getByRole('link', { name: 'إرسال بياناتي للتقديم', exact: true })
    .click();
  await expect(page.getByRole('link', { name: 'سجل الدخول لمراجعة بيانات التقديم' })).toBeVisible();
  await expect(
    page.locator('.student-link-card a').filter({ hasText: 'إرسال بياناتي للتقديم' }),
  ).toHaveCount(7);
  await page.locator('[name=q]').fill('الأمن السيبراني');
  await page.getByRole('button', { name: 'بحث', exact: true }).click();
  await expect(page.locator('.student-link-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'مسح التصفية', exact: true }).click();
  await page.locator('[name=category]').selectOption('scholarship');
  await page.getByRole('button', { name: 'بحث', exact: true }).click();
  await expect(page.locator('.student-link-card')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'إخفاء فرص الديمو', exact: true })).toHaveCount(0);
  await page.goto('/services?kind=service&opportunity=forged');
  await expect(page.getByRole('status')).toContainText('هذه الفرصة غير متاحة');
  await page.goto('/services?kind=team');
  await expect(page.getByText('ديمو: مطور واجهات مبتدئ', { exact: true })).toHaveCount(0);
});
test('Student Link guest and student light/dark layouts are accessible and fit narrow screens', async ({
  page,
}, info) => {
  for (const signed of [false, true]) {
    if (signed) {
      await page.waitForTimeout(11000);
      await page.goto('/login');
      await page.locator('[name=email]').fill(accounts.demostudent.email);
      await page.locator('[name=password]').fill(accounts.demostudent.password);
      await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
      await expect(page).not.toHaveURL(/\/login/);
    }
    for (const theme of ['light', 'dark'])
      for (const width of [1280, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto('/services?kind=service&q=ديمو:');
        await page.evaluate((theme) => {
          localStorage.setItem('student-hub-theme', theme);
          document.documentElement.dataset.theme = theme;
        }, theme);
        await page.mouse.move(0, 0);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            document
              .getAnimations()
              .filter((a) => a.effect?.getTiming().iterations !== Infinity)
              .map((a) => a.finished.catch(() => {})),
          );
        });
        await expect(page.locator('.student-link-card').filter({ hasText: 'ديمو:' })).toHaveCount(
          7,
        );
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        expect(results.violations).toEqual([]);
        await page.screenshot({
          path: info.outputPath(
            `student-link-${signed ? 'student' : 'guest'}-${theme}-${width}.png`,
          ),
          fullPage: true,
        });
        if (width === 320) {
          await page
            .getByRole('link', { name: /عرض التفاصيل.*ديمو: منحة التفوق الأكاديمي/, exact: true })
            .click();
          await expect(page.locator('.student-link-detail')).toBeVisible();
          await expect(page).toHaveTitle(/الخدمات الأساسية/);
          await page.evaluate(async () => {
            await document.fonts.ready;
            await new Promise(requestAnimationFrame);
          });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          expect(
            (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
          ).toEqual([]);
          await page.screenshot({
            path: info.outputPath(
              `student-link-detail-${signed ? 'student' : 'guest'}-${theme}.png`,
            ),
            fullPage: true,
          });
        }
      }
  }
});

test('authorized manager authors a real scoped opportunity, student applies privately, mocks reject forged submission', async ({
  page,
}) => {
  test.setTimeout(90000);
  async function login(key: string) {
    await page.waitForTimeout(11000);
    await page.goto('/login');
    await page.locator('[name=email]').fill(accounts[key].email);
    await page.locator('[name=password]').fill(accounts[key].password);
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);
  }
  await login('demoadmin');
  await page.goto('/manage?new=1');
  await page.getByLabel('المؤسسة', { exact: true }).selectOption({ label: 'مصادر التعلم' });
  await page.locator('select[name=kind]').selectOption('service');
  const title = 'فرصة اختبار محلية ' + Date.now();
  await page.getByLabel('العنوان', { exact: true }).fill(title);
  await page
    .getByLabel('الوصف والتفاصيل')
    .fill('وصف فرصة محلية في قاعدة الاختبار فقط لا يمثل وظيفة إنتاجية.');
  await page.locator('select[name=opportunityType]').selectOption('job');
  await page.getByLabel('الجهة المقدمة', { exact: true }).fill('جهة اختبار محلية');
  await page
    .getByLabel('الشروط والمتطلبات', { exact: true })
    .fill('شروط اختبار محفوظة تظهر في تفاصيل الفرصة.');
  await page.getByLabel('منشور للطلاب داخل النطاق').check();
  await page.getByRole('button', { name: 'حفظ ونشر حسب الاختيار' }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('demostudent');
  await page.goto('/services?kind=service&demos=off');
  await page.getByRole('link', { name: 'عرض التفاصيل: ' + title, exact: true }).click();
  await expect(page.locator('.student-link-detail')).toContainText('شروط اختبار محفوظة');
  await page
    .locator('.student-link-detail')
    .getByRole('link', { name: 'إرسال بياناتي للتقديم', exact: true })
    .click();
  const form = page.locator('.opportunity-application form');
  await expect(form).toBeVisible();
  await form.locator('[name=body]').fill('طلب اختبار محلي خاص للتأكد من حفظ الطلب والمتابعة.');
  await form.locator('[name=applicationConsent]').check();
  const entry = await form.locator('[name=entryId]').inputValue();
  await page.route('**/services**', async (route) => {
    const req = route.request(),
      body = req.postData();
    if (req.method() === 'POST' && body?.includes(entry))
      await route.continue({ postData: body.replaceAll(entry, 'student-link-demo-ui') });
    else await route.continue();
  });
  await form.getByRole('button', { name: 'تأكيد إرسال بياناتي للتقديم' }).click();
  await expect(form.getByRole('alert')).toBeVisible();
  await page.unroute('**/services**');
  await form.locator('[name=body]').fill('طلب اختبار محلي خاص للتأكد من حفظ الطلب والمتابعة.');
  await form.locator('[name=applicationConsent]').check();
  await form.getByRole('button', { name: 'تأكيد إرسال بياناتي للتقديم' }).click();
  await expect(page.getByRole('link', { name: 'متابعة طلب التقديم', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'متابعة طلب التقديم', exact: true }).click();
  await expect(page.locator('main')).toContainText(title);
  await expect(page.locator('main')).toContainText(accounts.demostudent.email);
});

test('opportunity applications review profile data, require consent, resist tampering and stay private', async ({
  page,
  browser,
}) => {
  test.setTimeout(90000);
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demostudent.email);
  await page.locator('[name=password]').fill(accounts.demostudent.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  const url = '/services?kind=service&opportunity=student-link-demo-ui&apply=student-link-demo-ui';
  await page.goto(url);
  const form = page.locator('.opportunity-application form');
  if (await form.count()) {
    await expect(page.locator('.opportunity-application')).toContainText(
      accounts.demostudent.email,
    );
    await expect(page.locator('.opportunity-application')).not.toContainText('الرقم القومي');
    await form.locator('[name=body]').fill('طلب اختبار داخلي فقط لفرصة برمجة الواجهات.');
    await form.locator('[name=applicationConsent]').check();
    const digest = await form.locator('[name=profileDigest]').inputValue();
    await form
      .locator('[name=profileDigest]')
      .evaluate((e) => ((e as HTMLInputElement).value = 'forged'));
    await form.getByRole('button', { name: 'تأكيد إرسال بياناتي للتقديم' }).click();
    await expect(form.getByRole('alert')).toBeVisible();
    await form
      .locator('[name=profileDigest]')
      .evaluate((e, d) => ((e as HTMLInputElement).value = d), digest);
    await form.locator('[name=body]').fill('طلب اختبار داخلي فقط لفرصة برمجة الواجهات.');
    await form.locator('[name=applicationConsent]').check();
    await form.getByRole('button', { name: 'تأكيد إرسال بياناتي للتقديم' }).click();
    await expect(page.getByRole('link', { name: 'متابعة طلب التقديم', exact: true })).toBeVisible();
    await page.reload();
  }
  const follow = page.getByRole('link', { name: 'متابعة طلب التقديم', exact: true });
  await expect(follow).toBeVisible();
  const request = await follow.getAttribute('href');
  await follow.click();
  await expect(page.locator('main')).toContainText(accounts.demostudent.email);
  await expect(page.locator('main')).toContainText('إرسال داخل المنصة');
  const ctx = await browser.newContext(),
    guest = await ctx.newPage();
  await guest.goto(request!);
  await expect(guest).toHaveURL(/login/);
  await ctx.close();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts.demoadmin.email);
  await page.locator('[name=password]').fill(accounts.demoadmin.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/admin/);
  await page.goto('/manage/support');
  await expect(
    page.getByRole('link').filter({ hasText: 'تقديم: ديمو: مطور واجهات مبتدئ' }),
  ).toBeVisible();
  await page.goto(request!);
  await expect(page.locator('main')).toContainText(accounts.demostudent.email);
});
