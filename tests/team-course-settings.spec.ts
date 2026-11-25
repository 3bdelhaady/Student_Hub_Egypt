import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('Coordinator enables one course; student gets automatic symbols and only enabled choices', async ({
  page,
}) => {
  test.setTimeout(300000);
  async function login(k: string) {
    await page.waitForTimeout(11000);
    await page.goto('/login');
    await page.locator('[name=email]').fill(a[k].email);
    await page.locator('[name=password]').fill(a[k].password);
    await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
    await expect(page).not.toHaveURL(/login/);
  }
  await login('union');
  await page.goto('/manage/team-settings');
  await page.getByLabel('اختر المقرر').selectOption('team-fixture-course-a');
  const card = page.locator('article');
  await card.locator('[name=enabled]').check();
  await card.locator('[name=approvalRequired]').check();
  await card.locator('[name=maxMembers]').fill('5');
  await card.locator('[name=conditions]').fill('الالتزام بتوزيع مهام المشروع');
  await card.getByRole('button').click();
  await expect(card.getByRole('status')).toContainText('تم حفظ');
  await page.goto('/manage?kind=team');
  await expect(
    page.getByRole('link', { name: 'مقرر اختبار الفرق الأول', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'مقرر اختبار الفرق الأول', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'الفرق في هذا المقرر', exact: true }),
  ).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('demostudent');
  await page.goto('/services?kind=team');
  await expect(
    page.getByRole('heading', { name: 'مقرر اختبار الفرق الأول', exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('إنشاء الفرق مفعّل', { exact: true }).first()).toBeVisible();
  await page.goto('/services?kind=team&course=math-2');
  await expect(
    page
      .locator('.academic-team-courses')
      .getByRole('heading', { name: 'الرياضيات ٢', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText('اختيار مقرر آخر', { exact: true })).toHaveCount(0);
  await expect(
    page
      .locator('.academic-team-courses')
      .getByRole('heading', { name: 'مقرر اختبار الفرق الأول', exact: true }),
  ).toBeVisible();
  await page.goto('/services/new-team?course=team-fixture-course-a');
  await expect(page.locator('[name=marker]')).toHaveCount(0);
  await expect(page.getByText('أقصى عدد أعضاء: 5')).toBeVisible();
  await expect(page.locator('option[value="draft-course"]')).toHaveCount(0);
  await expect(page.locator('option[value="math-2"]')).toHaveCount(0);
  await page.locator('[name=title]').fill('طلب مقرر غير مفعل');
  await page
    .locator('textarea[name=description]')
    .fill('وصف مطول لاختبار منع مقرر لم يفعل المنسق الفرق فيه.');
  await page.locator('select[name=courseId]').evaluate((e) => {
    const o = document.createElement('option');
    o.value = 'math-2';
    o.textContent = 'forged disabled';
    e.append(o);
  });
  await page.locator('select[name=courseId]').selectOption('math-2');
  await page.getByRole('button', { name: 'إرسال طلب إنشاء فريق', exact: true }).click();
  await expect(page.locator('.academic-team-creation-form [role=alert]')).toContainText(
    'تعذر إرسال الطلب',
  );
  await page.locator('select[name=courseId]').selectOption('team-fixture-course-a');
  const pendingTitle = 'فريق مقرر تلقائي ' + Date.now();
  await page.locator('[name=title]').fill(pendingTitle);
  await page
    .locator('textarea[name=description]')
    .fill('مشروع طلابي محلي لاختبار الشروط والترميز التلقائي.');
  await page.getByRole('button', { name: 'إرسال طلب إنشاء فريق', exact: true }).click();
  await expect(page).toHaveURL(/services\?kind=team&course=/);
  await page.goto('/services?kind=team');
  await expect(
    page.locator('.academic-team-card').getByRole('heading', { name: pendingTitle, exact: true }),
  ).toHaveCount(0);
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('union');
  await page.goto('/manage?kind=team&tab=requests');
  await page
    .getByRole('link')
    .filter({ has: page.getByRole('heading', { name: pendingTitle, exact: true }) })
    .click();
  await page.locator('textarea[name=body]').fill('بدء متابعة طلب الفريق من المنسق قبل القبول');
  await page.getByRole('button', { name: 'إضافة رد', exact: true }).click();
  await page.reload();
  await expect(page.locator('.status-pill').first()).toContainText('جارٍ المتابعة');
  await expect(page.locator('select[name=status] option')).toHaveCount(2);
  await page.locator('select[name=status]').selectOption('accepted');
  await page.getByRole('button', { name: 'تحديث الحالة', exact: true }).click();
  await expect(page.locator('.status-pill').first()).toContainText('مقبول');
  await page.goto('/manage/team-settings');
  await page.getByLabel('اختر المقرر').selectOption('team-fixture-course-a');
  await page.locator('[name=approvalRequired]').uncheck();
  await page.locator('article button').click();
  await expect(page.locator('article [role=status]')).toContainText('تم حفظ');
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('demostudent');
  await page.goto('/services/new-team?course=team-fixture-course-a');
  await expect(
    page.getByText('يُتاح الفريق مباشرة دون انتظار موافقة المنسق.', { exact: false }),
  ).toBeVisible();
  const automaticTitle = 'فريق مباشر ' + Date.now();
  await page.locator('[name=title]').fill(automaticTitle);
  await page
    .locator('textarea[name=description]')
    .fill('وصف مشروع أكاديمي لاختبار الإتاحة المباشرة بدون مراجعة');
  await page.getByRole('button', { name: 'إرسال طلب إنشاء فريق', exact: true }).click();
  await expect(page).toHaveURL(/services\?kind=team&course=/);
  await page.goto(
    '/services?kind=team&course=team-fixture-course-a&q=' + encodeURIComponent(automaticTitle),
  );
  await expect(page.getByRole('heading', { name: automaticTitle, exact: true })).toBeVisible();
  await page.goto(
    '/services?kind=team&course=team-fixture-course-a&q=' + encodeURIComponent(pendingTitle),
  );
  await expect(page.getByRole('heading', { name: pendingTitle, exact: true })).toBeVisible();

  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('student');
  await page.goto(
    '/services?kind=team&course=team-fixture-course-a&q=' + encodeURIComponent(automaticTitle),
  );
  await page.getByRole('heading', { name: automaticTitle, exact: true }).getByRole('link').click();
  await expect(page).toHaveURL(/\/services\/[^/?]+/);
  const teamUrl = page.url();
  await page
    .locator('#team-apply textarea[name=body]')
    .fill('انضمام طالب آخر لاختبار موافقة المنسق وحساب السعة المتبقية');
  await page.getByRole('button', { name: 'إرسال الطلب للمراجعة', exact: true }).click();
  await page.getByRole('link', { name: 'متابعة طلبك الحالي', exact: true }).click();
  await expect(page).toHaveURL(/\/requests\//);
  const joinUrl = page.url();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('demostudent');
  await page.goto(teamUrl);
  await expect(page.getByRole('heading', { name: 'إدارة فريقي', exact: true })).toBeVisible();
  await page.locator('select[name=outcome]').selectOption('accepted');
  await page.getByRole('button', { name: 'تأكيد القرار', exact: true }).click();
  await expect(page.getByText('لا توجد طلبات انضمام جديدة.')).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('student');
  await page.goto(teamUrl);
  await expect(page.getByRole('heading', { name: 'عضويتي في الفريق', exact: true })).toBeVisible();
  await page.goto(joinUrl);
  await expect(page.locator('select[name=status]')).toHaveCount(0);
  await expect(page.locator('.status-pill').first()).toContainText('مقبول');
  await page.goto(
    '/services?kind=team&course=team-fixture-course-a&q=' + encodeURIComponent(pendingTitle),
  );
  await page.getByRole('heading', { name: pendingTitle, exact: true }).getByRole('link').click();
  await expect(page).toHaveURL(/\/services\/[^/?]+/);
  const declinedTeamUrl = page.url();
  await page
    .locator('#team-apply textarea[name=body]')
    .fill('طلب انضمام لاختبار قرار الرفض وحفظ السعة دون تغيير');
  await page.getByRole('button', { name: 'إرسال الطلب للمراجعة', exact: true }).click();
  await page.getByRole('link', { name: 'متابعة طلبك الحالي', exact: true }).click();
  await expect(page).toHaveURL(/\/requests\//);
  const declinedRequestUrl = page.url();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('demostudent');
  await page.goto(declinedTeamUrl);
  await page.locator('select[name=outcome]').selectOption('declined');
  await page.getByRole('button', { name: 'تأكيد القرار', exact: true }).click();
  await expect(page.getByText('لا توجد طلبات انضمام جديدة.')).toBeVisible();
  await expect(page.getByText('4 مقعد متاح للتقديم', { exact: true })).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await login('student');
  await page.goto(declinedRequestUrl);
  await expect(page.locator('.status-pill').first()).toContainText('مكتمل');
  await expect(
    page.getByText('لم يوافق قائد الفريق على طلب الانضمام.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('select[name=status]')).toHaveCount(0);
  await page.goto('/services/new-team?course=team-fixture-course-a');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: test.info().outputPath('team-create-' + width + '.png'),
      fullPage: true,
    });
  }
});
