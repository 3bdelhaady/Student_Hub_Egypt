import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
test.use({ actionTimeout: 10000 });
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
const route = (name: string) => '/services?kind=poll&poll=voice-fixture-' + name;
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
test('Student Voice rejects forged lifecycle, scope and option votes, persists one real vote and rejects a stale duplicate', async ({
  page,
  context,
}) => {
  await login(page);
  for (const [target, option] of [
    ['disabled', 'disabled-a'],
    ['upcoming', 'upcoming-a'],
    ['closed', 'closed-a'],
    ['hidden', 'hidden-a'],
    ['draft', 'draft-a'],
    ['open', 'closed-a'],
  ]) {
    await page.goto(route('open'));
    const form = page.locator('.student-voice-ballot form');
    await form.getByRole('radio').first().check();
    await form
      .locator('[name=entryId]')
      .evaluate((e, id) => ((e as HTMLInputElement).value = id), 'voice-fixture-' + target);
    await form
      .getByRole('radio')
      .first()
      .evaluate((e, id) => ((e as HTMLInputElement).value = id), 'voice-fixture-' + option);
    await form.getByRole('button', { name: 'تأكيد التصويت' }).click();
    await expect(form.getByRole('alert')).toContainText('تعذر التصويت');
  }
  await page.goto(route('open'));
  await expect(page.locator('.student-voice-count')).toHaveText('0 صوت مسجل');
  const stale = await context.newPage();
  await stale.goto(route('open'));
  await stale.getByRole('radio').first().check();
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'تأكيد التصويت' }).click();
  await expect(page.locator('.student-voice-status')).toHaveText('تم تسجيل صوتك');
  await expect(page.locator('.student-voice-count')).toHaveText('1 صوت مسجل');
  await expect(page.getByRole('radio')).toHaveCount(0);
  await stale.getByRole('button', { name: 'تأكيد التصويت' }).click();
  await expect(stale.locator('.student-voice-ballot [role=alert]')).toContainText('تعذر التصويت');
  await page.reload();
  await expect(page.locator('.student-voice-count')).toHaveText('1 صوت مسجل');
  await expect(page.locator('.student-voice-results')).toContainText('اختيارك');
  await page.getByRole('link', { name: 'فتح صفحة الاستبيان' }).click();
  await expect(page.locator('.student-voice-count')).toHaveText('1 صوت مسجل');
  await expect(page.locator('.portal-detail-aside')).toHaveCount(0);
  await stale.close();
});
test('Student Voice keeps private/draft polls hidden, requires active membership and blocks agent mode', async ({
  page,
}) => {
  await login(page, 'student');
  await page.goto(route('open'));
  await page.getByRole('radio').first().check();
  const agentStale = await page.context().newPage();
  await agentStale.goto(route('open'));
  await agentStale.getByRole('radio').first().check();
  const switcher = await page.context().newPage();
  await switcher.goto('/settings');
  await switcher.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login(switcher, 'locked');
  await page.getByRole('button', { name: 'تأكيد التصويت' }).click();
  await expect(page.locator('.student-voice-ballot [role=alert]')).toContainText('تعذر التصويت');
  await switcher.close();
  await page.goto(route('open'));
  await expect(page.getByText('التصويت يحتاج عضوية جامعية مفعّلة.')).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
  for (const name of ['hidden', 'draft']) {
    await page.goto(route(name));
    await expect(page.locator('.student-voice-ballot h2')).not.toHaveText('استبيان محلي ' + name);
    await page.goto('/services/voice-fixture-' + name);
    await expect(
      page.getByRole('heading', { name: 'استبيان محلي ' + name, exact: true }),
    ).toHaveCount(0);
  }
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login(page, 'demoagent');
  await page.goto(route('open'));
  await expect(page).toHaveURL(/\/(manage|agent)/);
  await expect(page.locator('.student-voice-ballot')).toHaveCount(0);
  await agentStale.getByRole('button', { name: 'تأكيد التصويت' }).click();
  await expect(agentStale).toHaveURL(/\/(manage|agent)/);
  await expect(agentStale.locator('.student-voice-ballot')).toHaveCount(0);
  await agentStale.close();
});
test('Student Voice guest navigation, closed aggregates and future-start states stay accessible at all widths and themes', async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const signedIn of [false, true]) {
    if (signedIn) await login(page, 'student');
    for (const theme of ['light', 'dark']) {
      await page.goto('/services?kind=poll');
      await page.evaluate((t) => {
        localStorage.setItem('hub-theme', t);
        document.documentElement.dataset.theme = t;
      }, theme);
      for (const width of [1280, 390, 320]) {
        await page.setViewportSize({ width, height: 940 });
        for (const name of ['open', 'closed', 'upcoming']) {
          await page.goto(route(name));
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          if (signedIn && name === 'open') await page.getByRole('radio').first().check();
          if (name === 'closed') {
            await expect(page.locator('.student-voice-count')).toHaveText('3 صوت مسجل');
            await expect(page.locator('.student-voice-results')).toContainText('67%');
            await expect(page.locator('.student-voice-results')).toContainText('33%');
          }
          if (name === 'upcoming') {
            await expect(page.getByRole('radio')).toHaveCount(0);
            await expect(page.locator('.student-voice-ballot .notice')).toContainText(
              'يبدأ التصويت',
            );
          }
          if (!signedIn && name === 'open') {
            const cta = page.getByRole('link', { name: 'سجل الدخول للتصويت' });
            await expect(cta).toHaveAttribute('href', /next=.*voice-fixture-open/);
          }
          await ready(page);
          await expect
            .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
            .toBe(true);
          const a = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
          expect(a.violations, JSON.stringify(a.violations, null, 2)).toEqual([]);
          await page.screenshot({
            path: test
              .info()
              .outputPath(`voice-${signedIn ? 'student' : 'guest'}-${name}-${theme}-${width}.png`),
            fullPage: true,
          });
          if (width === 390)
            await page.screenshot({
              path: test
                .info()
                .outputPath(`viewport-${signedIn ? 'student' : 'guest'}-${name}-${theme}.png`),
            });
        }
      }
    }
  }
  await page.goto('/services?kind=poll&q=NO_SUCH_POLL_LOCAL');
  await expect(page.getByRole('heading', { name: 'لا توجد استبيانات مطابقة' })).toBeVisible();
  await page.getByRole('link', { name: 'مسح الفلاتر' }).click();
  await expect(page.locator('.student-voice-ballot')).toBeVisible();
});

test('Student Voice picker, saved-only filters, search clearing and opened narrow controls are real', async ({
  page,
}) => {
  await login(page, 'outsider');
  await page.goto(route('open'));
  await page.locator('.student-voice-picker > summary').click();
  await page.locator('.student-voice-picker select').selectOption('voice-fixture-upcoming');
  await page
    .locator('.student-voice-picker')
    .getByRole('button', { name: 'عرض', exact: true })
    .click();
  await expect(page).toHaveURL(/poll=voice-fixture-upcoming/);
  await page.getByRole('button', { name: 'حفظ في قائمتي', exact: true }).click();
  await expect(page.getByRole('button', { name: 'إزالة من المحفوظات', exact: true })).toBeVisible();
  await page.locator('.student-voice-filter-disclosure > summary').click();
  await page.getByRole('link', { name: 'المحفوظات', exact: true }).click();
  await expect(page.locator('.student-voice-ballot h2')).toHaveText('استبيان محلي upcoming');
  await page.getByRole('button', { name: 'إزالة من المحفوظات', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'لا توجد استبيانات مطابقة' })).toBeVisible();
  await page.getByRole('link', { name: 'مسح الفلاتر', exact: true }).click();
  await page.locator('.student-voice-filter-disclosure > summary').click();
  await page.getByLabel('بحث في الاستبيانات', { exact: true }).fill('NO_SUCH_POLL_REVIEW');
  await page.getByRole('button', { name: 'تطبيق', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'لا توجد استبيانات مطابقة' })).toBeVisible();
  await page.getByRole('link', { name: 'مسح الفلاتر', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 940 });
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => localStorage.setItem('hub-theme', t), theme);
    await page.goto(route('open'));
    await page.locator('.student-voice-filter-disclosure > summary').click();
    await page.locator('.student-voice-picker > summary').click();
    await page.locator('.student-voice-description > summary').click();
    await ready(page);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    const a = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(a.violations, JSON.stringify(a.violations, null, 2)).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath(`voice-expanded-${theme}-320.png`),
      fullPage: true,
    });
  }
});
