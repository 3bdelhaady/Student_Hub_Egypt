import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(page: Page, key: string) {
  await page.waitForTimeout(11000);
  await page.goto('/login');
  await page.locator('[name=email]').fill(accounts[key].email);
  await page.locator('[name=password]').fill(accounts[key].password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function logout(page: Page) {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
}
async function scope(page: Page) {
  await page.getByLabel('المؤسسة', { exact: true }).selectOption({ label: 'مصادر التعلم' });
}
test('certificate registry manual and CSV records verify by full serial, reject partial lookup, retain reserved deleted serials', async ({
  page,
}) => {
  test.setTimeout(90000);
  const serial = 'CERT-LOCAL-' + Date.now();
  await login(page, 'demoadmin');
  await page.goto('/manage/certificates?new=1');
  await scope(page);
  await page.getByLabel('اسم صاحب الشهادة', { exact: true }).fill('طالب اختبار محلي');
  await page.getByLabel('عنوان الشهادة', { exact: true }).fill('شهادة اختبار محلية');
  await page.getByLabel('تاريخ الإصدار', { exact: true }).fill('2026-11-22');
  await page.locator('[name=serial]').fill(serial);
  await page.locator('[name=published]').check();
  await page.getByRole('button', { name: 'حفظ سجل الشهادة' }).click();
  await expect(page.locator('.form-success')).toContainText('تم حفظ');
  await page.goto('/manage/certificates?q=' + serial);
  await page.getByRole('link', { name: 'تعديل أو حذف' }).click();
  await expect(page).toHaveURL(/edit=/);
  const edit = page.url();
  await page.getByLabel('عنوان الشهادة', { exact: true }).fill('عنوان شهادة معدل');
  await page.getByRole('button', { name: 'حفظ سجل الشهادة' }).click();
  await expect(page.locator('.form-success')).toContainText('تم حفظ');
  await page.goto('/manage/certificates?csv=1');
  await scope(page);
  const csvSerial = serial + '-CSV';
  await page.locator('input[type=file]').setInputFiles({
    name: 'certs.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'serial,recipientName,certificateTitle,issuedOn\n' +
        csvSerial +
        ',طالب CSV محلي,شهادة CSV,2026-11-21',
    ),
  });
  await expect(page.getByRole('heading', { name: 'معاينة 1 سجل قبل الاستيراد' })).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('certificate-csv-preview.png'),
    fullPage: true,
  });
  await page.locator('[name=confirmed]').check();
  await page.locator('[name=published]').check();
  await page.getByRole('button', { name: 'استيراد الدفعة بعد المراجعة' }).click();
  await expect(page.locator('.form-success')).toContainText('تم استيراد 1');
  await logout(page);
  await login(page, 'demostudent');
  await page.goto('/services?kind=certificate');
  await page.locator('[name=serial]').fill(serial);
  await page.getByRole('button', { name: 'تحقق الآن من البيانات' }).click();
  await expect(page.locator('.certificate-result')).toContainText('عنوان شهادة معدل');
  await expect(page.locator('.certificate-result')).toContainText('طالب اختبار محلي');
  await page.screenshot({
    path: test.info().outputPath('certificate-lookup-result.png'),
    fullPage: true,
  });
  await page.locator('[name=serial]').fill(csvSerial);
  await page.getByRole('button', { name: 'تحقق الآن من البيانات' }).click();
  await expect(page.locator('.certificate-result')).toContainText('شهادة CSV');
  await page.locator('[name=serial]').fill('CERT-NOT-FOUND-123');
  await page.getByRole('button', { name: 'تحقق الآن من البيانات' }).click();
  await expect(page.locator('.certificate-result')).toHaveCount(0);
  await expect(page.locator('.form-error')).toContainText('لم نعثر');
  await page.goto(edit);
  await expect(page.getByRole('button', { name: 'حفظ سجل الشهادة' })).toHaveCount(0);
  await logout(page);
  await login(page, 'demoadmin');
  await page.goto(edit);
  await page.locator('[name=confirm]').check();
  await page.getByRole('button', { name: 'حذف سجل الشهادة' }).click();
  await expect(page).toHaveURL(/deleted=1/);
  await page.goto('/manage/certificates?q=' + serial);
  await expect(page.getByText('طالب اختبار محلي', { exact: true })).toHaveCount(0);
  await page.goto('/manage/certificates?csv=1');
  await scope(page);
  await page.locator('input[type=file]').setInputFiles({
    name: 'duplicate.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'serial,recipientName,certificateTitle,issuedOn\n' +
        serial +
        ',طالب آخر,شهادة أخرى,2026-11-22',
    ),
  });
  await page.locator('[name=confirmed]').check();
  await page.getByRole('button', { name: 'استيراد الدفعة بعد المراجعة' }).click();
  await expect(page.locator('.form-error')).toContainText('لم تُستورد دفعة جزئية');
});
test('certificate verification guest gate and student light/dark widths fit and pass accessibility', async ({
  page,
}, info) => {
  await page.goto('/services?kind=certificate');
  await expect(page.getByRole('link', { name: 'تسجيل الدخول للتحقق' })).toBeVisible();
  await expect(page.locator('[name=serial]')).toHaveCount(0);
  await login(page, 'demostudent');
  for (const theme of ['light', 'dark'])
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/services?kind=certificate');
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('student-hub-theme', theme);
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
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
      ).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`cert-${theme}-${width}.png`),
        fullPage: true,
      });
    }
});

test('certificate management rejects student and absent-section agents and scopes legacy read-only agents', async ({
  page,
}) => {
  test.setTimeout(90000);
  await login(page, 'sectionwriter');
  await page.goto('/manage/certificates');
  await expect(page.getByRole('heading', { name: 'سجل الشهادات', exact: true })).toHaveCount(0);
  await page.goto('/manage/certificates?new=1');
  await expect(page.getByRole('button', { name: 'حفظ سجل الشهادة' })).toHaveCount(0);
  await logout(page);
  await login(page, 'readagent');
  await page.goto('/manage/certificates');
  await expect(page.getByRole('heading', { name: 'سجل الشهادات', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'إضافة يدوية', exact: true })).toHaveCount(0);
  await page.goto('/manage/certificates?new=1');
  await expect(page.getByRole('button', { name: 'حفظ سجل الشهادة' })).toHaveCount(0);
});

test('union agent creates only own faculty organization certificate records', async ({ page }) => {
  await login(page, 'union');
  await page.goto('/manage/certificates?new=1');
  await page.getByLabel('اسم صاحب الشهادة', { exact: true }).fill('طالب نطاق الاتحاد المحلي');
  await page.getByLabel('عنوان الشهادة', { exact: true }).fill('شهادة نطاق الاتحاد');
  await page.getByLabel('تاريخ الإصدار', { exact: true }).fill('2026-11-22');
  await page.locator('input[name=facultyId]').evaluate((el: HTMLInputElement) => {
    el.value = 'test-other-faculty';
  });
  await page.getByRole('button', { name: 'حفظ سجل الشهادة' }).click();
  await expect(page.locator('.form-error')).toContainText('تعذر الحفظ');
  await page.locator('input[name=facultyId]').evaluate((el: HTMLInputElement) => {
    el.value = 'demo-computing';
  });
  await page.getByRole('button', { name: 'حفظ سجل الشهادة' }).click();
  await expect(page.locator('.form-success')).toContainText('لموافقة شؤون الطلاب');
  await page.goto('/manage/certificates');
  await expect(page.getByText('طالب نطاق الاتحاد المحلي', { exact: false }).first()).toBeVisible();
});

test('certificate lookup throttles repeated unknown serials without exposing a directory', async ({
  page,
}) => {
  await login(page, 'student');
  await page.goto('/services?kind=certificate');
  for (let n = 0; n < 21; n++) {
    await page.locator('[name=serial]').fill('CERT-UNKNOWN-' + n.toString().padStart(8, '0'));
    const response = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().includes('/services'),
    );
    await page.getByRole('button', { name: 'تحقق الآن من البيانات' }).click();
    await response;
    await expect(page.getByRole('button', { name: 'تحقق الآن من البيانات' })).toBeEnabled();
    await expect(page.locator('.form-error')).toContainText(n < 20 ? 'لم نعثر' : 'الحد 20');
    await expect(page.locator('.certificate-result')).toHaveCount(0);
  }
});
