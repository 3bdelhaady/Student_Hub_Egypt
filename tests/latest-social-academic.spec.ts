import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
async function login(p: Page, key: string) {
  await p.waitForTimeout(11000);
  await p.goto('/login');
  await p.locator('[name=email]').fill(accounts[key].email);
  await p.locator('[name=password]').fill(accounts[key].password);
  await p.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(p).not.toHaveURL(/login/);
}
test('private image and video posts persist through affairs review and internal scheduling', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(85000);
  await login(page, 'demoagent');
  await page.goto('/manage/access');
  const grant = page
    .locator('.portal-form-section')
    .filter({ hasText: accounts.union.email })
    .first()
    .locator('form')
    .first();
  for (const right of ['قراءة', 'تعديل'])
    await grant
      .getByRole('checkbox', { name: 'إدارة قنوات التواصل: ' + right, exact: true })
      .check();
  await grant.getByRole('button').last().click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  const ctx = await browser.newContext(),
    writer = await ctx.newPage();
  await login(writer, 'union');
  await writer.goto('/manage/social');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
    'base64',
  );
  const pngName = 'social-private-' + Date.now() + '.png';
  await writer.locator('[name=contentType]').selectOption('image');
  await writer.locator('[name=media]').setInputFiles({
    name: 'bad.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg></svg>'),
  });
  await expect(writer.locator('.form-error[role=alert]')).toBeVisible();
  await writer
    .locator('[name=media]')
    .setInputFiles({ name: pngName, mimeType: 'image/png', buffer: png });
  await expect(writer.locator('form img')).toBeVisible();
  await writer.screenshot({ path: info.outputPath('image-upload-preview.png'), fullPage: true });
  await writer.getByRole('button', { name: 'إرسال إلى شؤون الطلاب', exact: true }).click();
  await expect(writer.getByRole('status')).toContainText('أُرسل');
  const own = writer.locator('article').filter({ hasText: pngName });
  await expect(own.locator('img')).toBeVisible();
  const imageUrl = await own.locator('img').getAttribute('src');
  expect(imageUrl).toBeTruthy();
  expect((await writer.request.get(imageUrl!)).status()).toBe(200);
  const anonymous = await browser.newContext();
  expect((await anonymous.request.get('http://localhost:3000' + imageUrl)).status()).toBe(404);
  await anonymous.close();
  await page.goto('/manage/social');
  const review = page.locator('article').filter({ hasText: pngName });
  await expect(review.locator('img')).toBeVisible();
  await review.locator('[name=intent]').selectOption('schedule');
  await review.locator('[name=scheduledAt]').fill('2030-12-15T14:30');
  await review.locator('button[type=submit]').click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.reload();
  const scheduled = page.locator('article').filter({ hasText: pngName });
  await expect(scheduled).toContainText('مجدول داخليًا');
  await scheduled.locator('[name=intent]').selectOption('publish');
  await scheduled.locator('button[type=submit]').click();
  await expect(page.getByRole('status')).toContainText('لم يتم النشر');
  await page.reload();
  const postId = await page
    .locator('article')
    .filter({ hasText: pngName })
    .locator('[name=id]')
    .inputValue();
  const replacement = page
    .locator('article')
    .filter({ has: page.locator(`input[name=id][value="${postId}"]`) });
  await replacement.locator('[name=contentType]').selectOption('video');
  await replacement.locator('[name=media]').setInputFiles({
    name: 'reviewed-clip.mp4',
    mimeType: 'video/mp4',
    buffer: fs.readFileSync('tests/fixtures/social-short.mp4'),
  });
  await expect(replacement.locator('video')).toBeVisible();
  await replacement.locator('[name=intent]').selectOption('edit');
  await replacement.locator('button[type=submit]').click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.reload();
  const video = page
    .locator('article')
    .filter({ has: page.locator(`input[name=id][value="${postId}"]`) });
  await expect(video.locator('video')).toBeVisible();
  await expect
    .poll(() => video.locator('video').evaluate((e) => (e as HTMLVideoElement).readyState))
    .toBeGreaterThanOrEqual(2);
  const videoUrl = await video.locator('video').getAttribute('src');
  const range = await page.request.get(videoUrl!, { headers: { Range: 'bytes=0-15' } });
  expect(range.status()).toBe(206);
  expect((await range.body()).length).toBe(16);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 960 });
    await page.screenshot({
      path: info.outputPath('social-video-review-' + width + '.png'),
      fullPage: true,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const other = await browser.newContext(),
    foreign = await other.newPage();
  await login(foreign, 'otheraffairs');
  expect((await foreign.request.get(videoUrl!)).status()).toBe(404);
  await other.close();
  await ctx.close();
});
test('affairs creates faculty course; Coordinators manage resources but not course data', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(150000);
  await login(page, 'demoagent');
  await page.goto('/manage/academic');
  await page.getByRole('link', { name: 'إضافة مقرر', exact: true }).click();
  const title = 'مقرر الكلية للمراجعة ' + Date.now();
  await page.locator('[name=title]').fill(title);
  await page
    .locator('textarea[name=description]')
    .fill('مقرر تضيفه شؤون الطلاب وتتاح إدارته لمنسقي الكلية المصرح لهم.');
  await page.locator('[name=code]').fill('CS-102');
  await page.locator('[name=instructor]').fill('شؤون طلاب الكلية');
  await page.getByRole('button', { name: 'حفظ التغييرات', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ المقرر');
  const ctx = await browser.newContext(),
    writer = await ctx.newPage();
  await login(writer, 'sectionwriter');
  await writer.goto('/manage/academic');
  await expect(writer.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(writer.getByRole('link', { name: 'إضافة مقرر', exact: true })).toHaveCount(0);
  await writer.getByRole('article').filter({ hasText: title }).getByRole('link').click();
  await expect(
    writer.getByRole('heading', { name: 'تعديل بيانات المقرر', exact: true }),
  ).toHaveCount(0);
  await expect(writer.locator('textarea[name=description]')).toHaveCount(0);
  await writer.getByRole('link', { name: 'إضافة مورد', exact: true }).click();
  await writer.locator('[name=title]').fill('مورد منسق للمقرر الجديد');
  await writer
    .locator('[name=body]')
    .fill('مورد يضيفه منسق الكلية دون أي تعديل لبيانات المقرر الأساسية.');
  await writer.getByRole('button', { name: 'حفظ التغييرات', exact: true }).click();
  await expect(writer.getByRole('status')).toContainText('تم حفظ المورد');
  await writer.screenshot({
    path: info.outputPath('faculty-coordinator-course.png'),
    fullPage: true,
  });
  await writer.goto('/profile');
  await expect(writer.getByRole('heading', { name: 'الملف الشخصي', exact: true })).toBeVisible();
  await expect(
    writer
      .getByRole('navigation', { name: 'أقسام Coordinator' })
      .getByRole('link', { name: 'الملف الشخصي', exact: true }),
  ).toHaveCount(1);
  await expect(
    writer
      .getByRole('navigation', { name: 'أقسام Coordinator' })
      .getByRole('link', { name: 'إعدادات الحساب', exact: true }),
  ).toHaveCount(0);
  await writer.screenshot({ path: info.outputPath('merged-profile.png'), fullPage: true });
  await writer.goto('/settings');
  await expect(writer).toHaveURL(/\/profile$/);
  await ctx.close();
});
