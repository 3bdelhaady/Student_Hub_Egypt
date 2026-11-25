import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const account = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8')).demostudent;
async function login(page: Page) {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(account.email);
  await page.locator('[name=password]').fill(account.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
test('academic course selection persists, cancels locally and rejects stale or unpublished selections', async ({
  page,
}) => {
  await login(page);
  await page.goto('/courses?view=manage');
  const original = JSON.parse(await page.locator('[name=previousIds]').inputValue()) as string[];
  const first = page.locator('.course-selection-card input[type=checkbox]').first();
  const id = (await first.getAttribute('data-course-id'))!;
  const wasChecked = await first.isChecked();
  const stale = await page.context().newPage();
  await stale.goto('/courses?view=manage');
  await first.setChecked(!wasChecked);
  await page
    .getByRole('textbox', { name: 'البحث في المقررات', exact: true })
    .fill('NO_MATCH_ENTER');
  await page.getByRole('textbox', { name: 'البحث في المقررات', exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: 'حفظ التعديلات', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'مسح البحث', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('لم تُحفظ');
  await page.getByRole('button', { name: 'حفظ التعديلات', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('حُفظت قائمة');
  await page.reload();
  await expect(page.locator(`[data-course-id="${id}"]`)).toBeChecked({ checked: !wasChecked });
  await expect(page.locator(`.academic-sidebar nav a[href="/courses/${id}"]`)).toHaveCount(
    wasChecked ? 0 : 1,
  );
  await page.locator(`[data-course-id="${id}"]`).setChecked(wasChecked);
  await page.getByRole('button', { name: 'إلغاء التغييرات', exact: true }).click();
  await expect(page.locator(`[data-course-id="${id}"]`)).toBeChecked({ checked: !wasChecked });
  await page
    .getByRole('textbox', { name: 'البحث في المقررات', exact: true })
    .fill('NO_MATCH_SELECTION');
  await expect(
    page.getByRole('heading', { name: 'لا توجد مقررات مطابقة.', exact: true }),
  ).toBeVisible();
  expect(JSON.parse(await page.locator('[name=courseIds]').inputValue()).includes(id)).toBe(
    !wasChecked,
  );
  await page.getByRole('button', { name: 'مسح البحث', exact: true }).click();
  await stale.locator(`[data-course-id="${id}"]`).setChecked(!wasChecked);
  await stale.getByRole('button', { name: 'حفظ التعديلات', exact: true }).click();
  await expect(stale.locator('.course-selection [role=alert]')).toContainText('تغيّرت قائمتك');
  await stale.close();
  await page.locator(`[data-course-id="${id}"]`).setChecked(wasChecked);
  await page.locator('[name=courseIds]').evaluate((element) => {
    (element as HTMLInputElement).value = JSON.stringify(['draft-course']);
  });
  await page.getByRole('button', { name: 'حفظ التعديلات', exact: true }).click();
  await expect(page.locator('.course-selection [role=alert]')).toContainText('لم يعد متاحًا');
  await page.reload();
  await expect(page.locator(`[data-course-id="${id}"]`)).toBeChecked({ checked: !wasChecked });
  for (const input of await page.locator('.course-selection-card input[type=checkbox]').all()) {
    const courseId = (await input.getAttribute('data-course-id'))!;
    await input.setChecked(original.includes(courseId));
  }
  await page.getByRole('button', { name: 'حفظ التعديلات', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('حُفظت قائمة');
  await page.reload();
  expect(JSON.parse(await page.locator('[name=previousIds]').inputValue()).sort()).toEqual(
    [...original].sort(),
  );
});

test('academic selection and course resources remain readable in light and dark at desktop and narrow sizes', async ({
  page,
}) => {
  await login(page);
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => {
      localStorage.setItem('hub-theme', value);
    }, theme);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 940 });
      for (const [name, route] of [
        ['selection', '/courses?view=manage'],
        ['resources', '/courses/math-2'],
      ]) {
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
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
          path: test.info().outputPath(`academic-${name}-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
  }
});

test('student login opens one course and the sidebar switches within the bundle while profile remains reachable', async ({
  page,
}) => {
  await login(page);
  await expect(page).toHaveURL(/\/courses\/[^/?]+$/);
  await expect(page.locator('.course-workspace-hero')).toHaveCount(1);
  const links = page.locator('.academic-sidebar nav a[href^="/courses/"]');
  expect(await links.count()).toBeGreaterThan(0);
  const target = await links.last().getAttribute('href');
  await links.last().click();
  await expect(page).toHaveURL(target!);
  await expect(page.locator('.academic-sidebar a[aria-current="page"]')).toHaveAttribute(
    'href',
    target!,
  );
  await page.goto('/courses');
  await expect(page).toHaveURL(/\/courses\/[^/?]+$/);
  await page.goto('/account?view=student');
  await expect(page).toHaveURL(/account\?view=student/);
});
