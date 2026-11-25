import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
test.use({ actionTimeout: 10000 });
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: Page, key = 'demostudent') {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function create(page: Page, title: string) {
  await page.goto('/learning/new');
  await page.getByLabel('اسم الدورة', { exact: true }).fill(title);
  await page.getByLabel('الوصف', { exact: true }).fill('مصادري الخاصة وملاحظاتي، اختبار محلي فقط.');
  await page.getByLabel('اسم المورد 1', { exact: true }).fill('المورد الأول');
  await page.getByLabel('رابط المورد 1 (HTTPS)', { exact: true }).fill('https://example.com/one');
  await page.getByRole('button', { name: 'إنشاء الدورة', exact: true }).click();
  await expect(page).toHaveURL(/\/learning\/[a-f0-9-]{36}$/);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  return page.url();
}
async function remove(page: Page) {
  const danger = page.locator('.personal-course-danger');
  await danger.locator('summary').click();
  await danger.getByRole('checkbox').check();
  await danger.getByRole('button', { name: 'حذف الدورة نهائيًا', exact: true }).click();
  await expect(page).toHaveURL(/\/services$/);
}
test('private courses save drafts, ordered resources, notes, edits and real progress without losing invalid input', async ({
  page,
}) => {
  await login(page);
  const title = 'خطة تعلم خاصة ' + Date.now();
  await page.goto('/learning/new');
  await page.getByLabel('اسم الدورة', { exact: true }).fill(title);
  await page.getByLabel('الوصف', { exact: true }).fill('خطة حقيقية للاختبار المحلي لا تمنح شهادة.');
  await page.getByLabel('اسم المورد 1', { exact: true }).fill('المورد الأول');
  const url = page.getByLabel('رابط المورد 1 (HTTPS)', { exact: true });
  await url.evaluate((e) => ((e as HTMLInputElement).type = 'text'));
  await url.fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'إنشاء الدورة', exact: true }).click();
  await expect(page.locator('.personal-course-create [role=alert]')).toContainText('HTTPS');
  await expect(page.getByLabel('اسم الدورة', { exact: true })).toHaveValue(title);
  await expect(url).toHaveValue('javascript:alert(1)');
  await url.fill('https://example.com/one');
  await page.getByRole('button', { name: 'أضف موردًا', exact: true }).click();
  await page.getByLabel('اسم المورد 2', { exact: true }).fill('المورد الثاني');
  await page.getByLabel('رابط المورد 2 (HTTPS)', { exact: true }).fill('https://example.com/two');
  await page.getByRole('button', { name: 'نقل المورد 2 لأعلى', exact: true }).click();
  await page.getByRole('button', { name: 'حفظ كمسودة', exact: true }).click();
  await expect(page).toHaveURL(/\/learning\/[a-f0-9-]{36}$/);
  const courseUrl = page.url();
  await expect(page.locator('.personal-course-title .tag')).toContainText('مسودة');
  await expect(page.locator('.personal-learning-resource').first()).toContainText('المورد الثاني');
  const settings = page.locator('#personal-course-settings');
  await settings.locator('summary').click();
  await settings.locator('select[name=status]').selectOption('active');
  await settings.getByRole('button', { name: 'حفظ تفاصيل الدورة', exact: true }).click();
  await expect(settings.getByRole('status')).toContainText('حُفظت');
  await expect(page.locator('.personal-course-title .tag')).not.toContainText('مسودة');
  await page
    .locator('.personal-learning-resource')
    .first()
    .getByRole('button', { name: 'تحديد كمكتمل', exact: true })
    .click();
  await page.reload();
  await expect(page.locator('.personal-learning-progress progress')).toHaveAttribute('value', '1');
  await expect(page.locator('.personal-learning-progress')).toContainText('50%');
  const add = page.getByRole('form', { name: 'إضافة مورد خاص', exact: true });
  await add.getByLabel('اسم المورد', { exact: true }).fill('ملاحظاتي الخاصة');
  await add
    .getByLabel('ملاحظة شخصية', { exact: true })
    .fill('ملاحظة شخصية محفوظة بعد إعادة التحميل.');
  await add.getByRole('button', { name: 'إضافة المورد', exact: true }).click();
  await expect(page.locator('.personal-learning-resource')).toHaveCount(3);
  await expect(page.locator('.personal-learning-progress')).toContainText('33%');
  await expect(add.getByLabel('اسم المورد', { exact: true })).toHaveValue('');
  const first = page.locator('.personal-learning-resource').first();
  await first.locator('.personal-resource-editor > summary').click();
  const edit = first.getByRole('form', { name: 'تعديل المورد الثاني', exact: true });
  await edit.getByLabel('ملاحظة شخصية', { exact: true }).fill('ملاحظة محدثة لا تمحو الإكمال.');
  await edit.getByRole('button', { name: 'حفظ المورد', exact: true }).click();
  await expect(edit.getByRole('status')).toContainText('حُفظت');
  await page.reload();
  await expect(page.locator('.personal-learning-resource').first()).toContainText('ملاحظة محدثة');
  await expect(page.locator('.personal-learning-progress progress')).toHaveAttribute('value', '1');
  const second = page.locator('.personal-learning-resource').nth(1);
  await second.locator('.personal-resource-delete > summary').click();
  await second.getByRole('button', { name: 'تأكيد حذف المورد', exact: true }).click();
  await expect(page.locator('.personal-learning-resource')).toHaveCount(2);
  await expect(page.locator('.personal-learning-progress')).toContainText('50%');
  await page
    .locator('.personal-learning-resource')
    .first()
    .getByRole('button', { name: 'التراجع عن الإكمال', exact: true })
    .click();
  await expect(page.locator('.personal-learning-progress progress')).toHaveAttribute('value', '0');
  await page.goto('/services');
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await page.goto(courseUrl);
  await remove(page);
  await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  await page.goto(courseUrl);
  await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
});
test('private courses reject another account reads and forged course/resource mutations, and block agent mode', async ({
  page,
  browser,
}) => {
  test.setTimeout(120000);
  await login(page);
  const title = 'عزل خاص ' + Date.now();
  const ownerUrl = await create(page, title);
  const ownerId = ownerUrl.split('/').pop()!;
  const resourceId = (await page
    .locator('.personal-learning-resource')
    .first()
    .getAttribute('data-resource-id'))!;
  const context = await browser.newContext();
  const other = await context.newPage();
  await login(other, 'outsider');
  await other.goto('/services');
  await expect(other.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  await other.goto(ownerUrl);
  await expect(other.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  const ownUrl = await create(other, 'دورة حساب آخر ' + Date.now());
  const add = other.getByRole('form', { name: 'إضافة مورد خاص', exact: true });
  await add.getByLabel('اسم المورد', { exact: true }).fill('مورد مزور');
  await add.getByLabel('ملاحظة شخصية', { exact: true }).fill('لا ينبغي حفظه في حساب آخر.');
  await add
    .locator('[name=courseId]')
    .evaluate((e, id) => ((e as HTMLInputElement).value = id), ownerId);
  await add.getByRole('button', { name: 'إضافة المورد', exact: true }).click();
  await expect(add.getByRole('alert')).toBeVisible();
  await other.reload();
  const control = other.locator('.personal-resource-controls form').first();
  await control
    .locator('[name=resourceId]')
    .evaluate((e, id) => ((e as HTMLInputElement).value = id), resourceId);
  await control.getByRole('button', { name: 'تحديد كمكتمل', exact: true }).click();
  await expect(control.getByRole('alert')).toBeVisible();
  const danger = other.locator('.personal-course-danger');
  await danger.locator('summary').click();
  await danger
    .locator('[name=courseId]')
    .evaluate((e, id) => ((e as HTMLInputElement).value = id), ownerId);
  await danger.getByRole('checkbox').check();
  await danger.getByRole('button', { name: 'حذف الدورة نهائيًا', exact: true }).click();
  await expect(danger.getByRole('alert')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.locator('.personal-learning-resource')).toHaveCount(1);
  await expect(page.locator('.personal-learning-progress progress')).toHaveAttribute('value', '0');
  const agentContext = await browser.newContext();
  const agent = await agentContext.newPage();
  await login(agent, 'union');
  await agent.goto('/learning/new');
  await expect(agent).toHaveURL(/\/manage$/);
  await agent.goto(ownerUrl);
  await expect(agent).toHaveURL(/\/manage$/);
  await expect(agent.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  await agentContext.close();
  await other.goto(ownUrl);
  await remove(other);
  await context.close();
  await page.goto(ownerUrl);
  await remove(page);
});
test('learning center, private creation and real personal progress remain accessible in light/dark at all widths', async ({
  page,
}) => {
  test.setTimeout(120000);
  await login(page);
  const title = 'مسار بصري خاص ' + Date.now();
  const url = await create(page, title);
  await page.getByRole('button', { name: 'تحديد كمكتمل', exact: true }).click();
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('hub-theme', value), theme);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 940 });
      for (const [name, route] of [
        ['center', '/services'],
        ['create', '/learning/new'],
        ['personal', url],
      ]) {
        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        if (name === 'personal') {
          await page.locator('.personal-resource-editor > summary').click();
          await page.locator('#personal-course-settings > summary').click();
        }
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          .toBe(true);
        await page.mouse.move(0, 0);
        await page.evaluate(async () => {
          await document.fonts.ready;
          getComputedStyle(document.body).backgroundColor;
          await Promise.all(
            document
              .getAnimations()
              .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
              .map((animation) => animation.finished.catch(() => {})),
          );
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          await new Promise(requestAnimationFrame);
        });
        if (name === 'create')
          await expect(page.locator('button[value=draft]')).toHaveCSS(
            'background-color',
            theme === 'dark' ? 'rgb(33, 59, 73)' : 'rgb(255, 255, 255)',
          );
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        ).toEqual([]);
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
        if (width === 390)
          await page.screenshot({
            path: test.info().outputPath(`viewport-${name}-${theme}-${width}.png`),
          });
        await page.screenshot({
          path: test.info().outputPath(`learning-${name}-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
  }
  await page.goto(url);
  await remove(page);
});
test('guest learning center is readable and private creation preserves the sign-in destination', async ({
  page,
}) => {
  for (const theme of ['light', 'dark']) {
    await page.goto('/services');
    await page.evaluate((value) => localStorage.setItem('hub-theme', value), theme);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 940 });
      await page.goto('/services');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.evaluate(async () => {
        await document.fonts.ready;
        getComputedStyle(document.body).backgroundColor;
        await Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        );
      });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath(`guest-learning-${theme}-${width}.png`),
        fullPage: true,
      });
    }
  }
  await page.goto('/learning/new');
  await expect(page).toHaveURL(/\/login\?next=%2Flearning%2Fnew$/);
  await expect(page.getByRole('link', { name: 'إنشاء حساب جديد', exact: true })).toHaveAttribute(
    'href',
    '/register?next=%2Flearning%2Fnew',
  );
});
