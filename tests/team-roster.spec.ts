import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('Coordinator sees actual team members and downloads scoped Arabic team/accepted-volunteer CSV', async ({
  page,
  browser,
}) => {
  test.setTimeout(110000);
  async function login(key: string) {
    await page.waitForTimeout(11000);
    await page.goto('/login');
    await page.locator('[name=email]').fill(a[key].email);
    await page.locator('[name=password]').fill(a[key].password);
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    await expect(page).not.toHaveURL(/login/);
  }
  await login('union');
  await page.goto('/manage?kind=team&course=team-fixture-course-a');
  await expect(
    page.getByRole('link', { name: 'تحميل بيانات طلاب المقرر CSV', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('.team-roster')
      .filter({ hasText: 'فريق سجل الطلاب' })
      .getByRole('cell', { name: 'حساب الطالب', exact: true }),
  ).toBeVisible();
  const res = await page.request.get('/api/manage/team-roster?course=team-fixture-course-a');
  expect(res.status()).toBe(200);
  expect(res.headers()['cache-control']).toBe('private, no-store');
  const bytes = await res.body();
  expect([...bytes.subarray(0, 3)]).toEqual([239, 187, 191]);
  const csv = bytes.toString('utf8');
  expect(csv).toContain('اسم الطالب');
  expect(csv).not.toContain('@');
  await page.screenshot({
    path: test.info().outputPath('team-roster-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: /فريق سجل الطلاب ·/ }).click();
  await expect(page.getByRole('heading', { name: 'فريق سجل الطلاب', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'حساب الطالب', exact: true })).toBeVisible();
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.locator('input:not([type=hidden])')).toHaveCount(0);
  await page.locator('textarea[name=description]').fill('وصف محلي محدث للفريق الأكاديمي');
  await page.getByRole('button', { name: 'حفظ الوصف', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('تم حفظ');
  await page.reload();
  await expect(page.locator('textarea[name=description]')).toHaveValue(
    'وصف محلي محدث للفريق الأكاديمي',
  );
  await page.screenshot({
    path: test.info().outputPath('team-detail-desktop.png'),
    fullPage: true,
  });
  for (const path of [
    '/api/manage/team-roster?course=other-course',
    '/api/manage/team-roster?course=team-fixture-course-a&team=review-demo-v1-team',
  ])
    expect((await page.request.get(path)).status()).toBe(404);
  await page.goto('/manage?kind=volunteer');
  await expect(
    page.getByRole('link', { name: 'تحميل بيانات المقبولين CSV', exact: true }),
  ).toBeVisible();
  const volunteers = await page.request.get('/api/manage/volunteers');
  expect(volunteers.status()).toBe(200);
  const volunteerCsv = await volunteers.text();
  expect(volunteerCsv).toContain('كود الطالب');
  expect(volunteerCsv).toContain('فريق تنظيم الأنشطة');
  expect(volunteerCsv.split('فريق تنظيم الأنشطة').length - 1).toBe(1);
  await page.screenshot({
    path: test.info().outputPath('volunteers-export-desktop.png'),
    fullPage: true,
  });
  await page.goto('/manage?kind=service');
  await expect(
    page.getByRole('link', { name: 'تحميل المتقدمين CSV', exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('applicant-actions-desktop.png'),
    fullPage: true,
  });
  const boxes = await page
    .locator('.management-row-actions')
    .first()
    .locator('a')
    .evaluateAll((links) =>
      links.map((a) => {
        const r = a.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      }),
    );
  for (let i = 1; i < boxes.length; i++)
    expect(
      boxes[i].y >= boxes[i - 1].bottom ||
        boxes[i].right + 8 <= boxes[i - 1].x ||
        boxes[i - 1].right + 8 <= boxes[i].x,
    ).toBe(true);
  const applicants = await page.request.get('/api/manage/applicants?entry=roster-fixture-service');
  expect(applicants.status()).toBe(200);
  expect(await applicants.text()).toContain('قيد المراجعة');
  expect(
    (await page.request.get('/api/manage/applicants?entry=review-demo-v1-poll')).status(),
  ).toBe(404);
  const guest = await browser.newContext();
  expect(
    (await guest.request.get('/api/manage/team-roster?course=team-fixture-course-a')).status(),
  ).toBe(401);
  await guest.close();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('demostudent');
  expect(
    (await page.request.get('/api/manage/team-roster?course=team-fixture-course-a')).status(),
  ).toBe(404);
  expect((await page.request.get('/api/manage/volunteers')).status()).toBe(404);
  expect(
    (await page.request.get('/api/manage/applicants?entry=roster-fixture-service')).status(),
  ).toBe(404);
});
