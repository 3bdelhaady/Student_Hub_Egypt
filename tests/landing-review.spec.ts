import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
test('landing store bento and six core services match their real destinations at desktop and mobile widths', async ({
  page,
}) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { name: 'خدمات المتجر', exact: true })).toBeVisible();
    await expect(page.locator('.reference-service-main')).toHaveAttribute(
      'href',
      '/register?next=%2Fstore',
    );
    await expect(page.locator('.reference-service-mint')).toHaveAttribute(
      'href',
      '/register?next=%2Fstore%3Fkind%3Dticket',
    );
    await expect(page.locator('.landing-core-card')).toHaveCount(6);
    await expect(
      page
        .locator('.landing-core-card')
        .filter({ has: page.getByRole('heading', { name: 'بوابة التحقق', exact: true }) }),
    ).toHaveAttribute('href', '/register?next=%2Fservices%3Fkind%3Dcertificate');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    await page
      .locator('.reference-hero')
      .screenshot({ path: test.info().outputPath(`landing-hero-${width}.png`) });
    await page
      .locator('#contact')
      .screenshot({ path: test.info().outputPath(`landing-contact-${width}.png`) });
    await page
      .locator('#services')
      .screenshot({ path: test.info().outputPath(`landing-bento-${width}.png`) });
    await page
      .locator('#core-services')
      .screenshot({ path: test.info().outputPath(`landing-core-${width}.png`) });
    await page
      .getByRole('link', { name: 'الفريق الأكاديمي', exact: false })
      .filter({ has: page.locator('h3') })
      .click();
    await expect(page).toHaveURL(/\/register\?next=%2Fservices%3Fkind%3Dteam$/);
  }
});

test('a visitor types name and email, sends a message, and the admin sees it', async ({
  page,
  browser,
}) => {
  const subject = 'رسالة زائر ' + Date.now();
  const body = 'هذه رسالة اختبار محلي من زائر لم يسجل بعد عبر نموذج التواصل.';
  await page.goto('/');
  const contact = page.locator('#contact');
  await contact.getByLabel('الاسم', { exact: true }).fill('زائر تجريبي');
  await contact.getByLabel('البريد الإلكتروني', { exact: true }).fill('visitor@example.com');
  await contact.getByLabel('الموضوع', { exact: true }).fill(subject);
  await contact.getByLabel('الرسالة', { exact: true }).fill(body);
  await contact.getByRole('button', { name: 'إرسال الرسالة', exact: true }).click();
  await expect(contact.getByRole('status')).toContainText('وصلت رسالتك وسنرد عليك على بريدك');
  const adminPage = await (await browser.newContext()).newPage();
  await adminPage.goto('/login');
  await adminPage.waitForTimeout(11000);
  await adminPage.locator('[name=email]').fill(accounts.admin.email);
  await adminPage.locator('[name=password]').fill(accounts.admin.password);
  await adminPage.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await adminPage.waitForURL(/\/(admin|manage|agent|account)/);
  await adminPage.goto('/manage/guest-messages');
  const card = adminPage.locator('.guest-message', { hasText: subject });
  await expect(card).toContainText('visitor@example.com');
  await expect(card).toContainText(body);
  await card.getByRole('button', { name: 'تمت القراءة', exact: true }).click();
  await expect(adminPage.locator('.guest-message', { hasText: subject })).toContainText(
    'تمت القراءة',
  );
});

test('guest form rejects bad email and silently drops honeypot bots', async ({ page }) => {
  await page.goto('/help');
  await page
    .getByRole('combobox', { name: 'نوع المشكلة', exact: true })
    .selectOption({ label: 'مشكلة أخرى' });
  await page.getByLabel('الاسم', { exact: true }).fill('زائر');
  await page.getByLabel('البريد الإلكتروني', { exact: true }).fill('not-an-email');
  await page.getByLabel('وصف المشكلة', { exact: true }).fill('وصف مشكلة طويل بما يكفي للإرسال.');
  await page.getByRole('button', { name: 'إرسال الرسالة', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page).toHaveURL(/\/help$/);
});

test('public support uses its own reference layout and preserves a typed issue for review', async ({
  page,
}) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    for (const route of ['/help', '/faq', '/privacy']) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(result.violations).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath(`public-${route.slice(1)}-${width}.png`),
        fullPage: true,
      });
    }
  }
  await page.goto('/help');
  await expect(page.locator('.public-support-page')).toBeVisible();
  await expect(page.locator('.portal-hero')).toHaveCount(0);
  await expect(page.getByLabel('الاسم', { exact: true })).toBeEditable();
  await expect(page.getByLabel('البريد الإلكتروني', { exact: true })).toBeEditable();
});

test('privacy sections, inquiry topic and print-to-PDF are real controls', async ({ page }) => {
  await page.goto('/privacy');
  const details = page.locator('.privacy-accordion details');
  await expect(details).toHaveCount(4);
  await expect(page.locator('.privacy-accordion details[open]')).toHaveCount(1);
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printOpened = String(
        [...document.querySelectorAll<HTMLDetailsElement>('.privacy-accordion details')].every(
          (x) => x.open,
        ),
      );
    };
  });
  await page.getByRole('button', { name: 'طباعة / حفظ PDF', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-print-opened', 'true');
  await expect(page.locator('.privacy-accordion details[open]')).toHaveCount(1);
  await page.getByRole('link', { name: 'إرسال استفسار', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'نوع المشكلة', exact: true })).toHaveValue(
    'دعم فني: الخصوصية والبيانات',
  );
  await page.goto('/privacy');
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll<HTMLDetailsElement>('.privacy-accordion details').forEach((x) => {
      x.open = true;
    });
  });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: test.info().outputPath('privacy-print.pdf'),
    format: 'A4',
    printBackground: true,
  });
});

test('homepage about, university cards, honest content charts and footer work at desktop and mobile sizes', async ({
  page,
}) => {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 940 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.reference-about .reference-value')).toHaveCount(2);
    await expect(page.locator('.reference-photo img')).toHaveAttribute(
      'alt',
      'روبوت أزرق بسماعات يستخدم حاسوبًا محمولًا',
    );
    await page
      .locator('.reference-hero')
      .screenshot({ path: test.info().outputPath(`blue-robot-hero-${width}.png`) });
    await expect(
      page.getByRole('link', { name: 'شبكة تواصل واسعة', exact: false }),
    ).toHaveAttribute('href', '/about');
    await expect(page.locator('.university-slide')).toHaveCount(2);
    await expect(page.locator('.public-statistics-card')).toHaveCount(3);
    await expect(page.locator('.public-statistics-card strong')).toHaveCount(3);
    await expect(page.locator('.reference-number-grid')).toContainText('عدد الطلاب');
    await expect(page.locator('footer .footer-contact a')).toHaveCount(3);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    for (const [selector, name] of [
      ['#about', 'about'],
      ['#university-community', 'universities'],
      ['.reference-numbers', 'statistics'],
      ['footer', 'footer'],
    ]) {
      await page
        .locator(selector)
        .screenshot({ path: test.info().outputPath(`home-${name}-${width}.png`) });
    }
    await expect(page.locator('#university-community a')).toHaveCount(0);
  }
});

test('university carousel arrows, swipe scrolling, facts and legacy directory redirect', async ({
  page,
}) => {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 940 });
    await page.goto('/');
    const region = page.locator('.university-carousel');
    await region.scrollIntoViewIfNeeded();
    await expect(region).toContainText('٢٠٢٥');
    await expect(region).toContainText('٢٠٢٢');
    await expect(region).not.toContainText('استكشف');
    await expect(region.getByRole('button', { name: 'الجامعة السابقة' })).toBeDisabled();
    await region.getByRole('button', { name: 'الجامعة التالية' }).click();
    await expect(region.locator('[aria-live]')).toHaveText('2 / 2');
    await expect(region.getByRole('button', { name: 'الجامعة التالية' })).toBeDisabled();
    const second = region.locator('.university-slide').nth(1);
    await expect
      .poll(() =>
        second.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.left >= -1 && r.right <= innerWidth + 1;
        }),
      )
      .toBe(true);
    await region.getByRole('button', { name: 'الجامعة السابقة' }).click();
    await expect(region.locator('[aria-live]')).toHaveText('1 / 2');
    await expect
      .poll(() =>
        region.locator('.university-carousel-track').evaluate((el) => Math.abs(el.scrollLeft)),
      )
      .toBeLessThan(2);
    if (width < 760) {
      await region
        .locator('.university-carousel-track')
        .evaluate((el) =>
          el.scrollTo({ left: -(el.scrollWidth - el.clientWidth), behavior: 'instant' }),
        );
      await expect(region.locator('[aria-live]')).toHaveText('2 / 2');
    } else {
      await region.getByRole('button', { name: 'عرض جامعة قنا الأهلية' }).click();
      await expect(region.locator('[aria-live]')).toHaveText('2 / 2');
      await expect(region.locator('.university-slide').nth(1)).toHaveClass(/is-current/);
    }
    await expect(region.locator('.university-carousel-dots button')).toHaveCount(2);
    await expect(region.locator('.university-carousel-track')).toHaveCSS('scrollbar-width', 'none');
    await region.screenshot({ path: test.info().outputPath(`campus-carousel-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.goto('/universities?university=demo-university');
  await expect(page).toHaveURL(/\/#university-community$/);
});

test('public community follows its own guest frame with working college and news filters', async ({
  page,
}) => {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 940 });
    await page.goto('/community');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.public-community')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'مجتمعك الجامعي', exact: true })).toBeVisible();
    await expect(page.locator('.community-faculty')).toHaveCount(8);
    await expect(page.locator('.community-join input')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    for (const [selector, name] of [
      ['.community-cover', 'hero'],
      ['.community-programs', 'colleges'],
      ['.community-news-section', 'news'],
      ['.community-join', 'join'],
    ])
      await page
        .locator(selector)
        .screenshot({ path: test.info().outputPath(`community-${name}-${width}.png`) });
    await page.getByLabel('اختر الجامعة', { exact: true }).selectOption('demo-university');
    await page.getByRole('button', { name: 'عرض الكليات والمحتوى', exact: true }).click();
    await expect(page).toHaveURL(/university=demo-university/);
    await expect(page.locator('.community-faculty p').first()).toHaveText('جامعة قنا الأهلية');
    const news = page.getByRole('search', { name: 'البحث في محتوى المجتمع', exact: true });
    await news.getByLabel('البحث', { exact: true }).fill('محتوى غير موجود 12345');
    await news.getByRole('button', { name: 'بحث', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'لا توجد نشرات مطابقة', exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'عرض جميع النشرات', exact: true }).click();
    const title = await page.locator('.community-news-copy h3').first().textContent();
    await page.locator('.community-news-card').first().click();
    await expect(page.getByRole('heading', { name: title!, exact: true })).toBeVisible();
    await page.goto('/community');
    await page.locator('.community-faculty').first().click();
    await expect(page).toHaveURL(/\/community\?university=.+#community-news$/);
    await expect(page.locator('.community-news-section')).toBeVisible();
  }
});

test('public footer theme controls persist, follow the device and keep public pages readable', async ({
  page,
}) => {
  await page.goto('/');
  const controls = page.getByRole('group', { name: 'مظهر المنصة', exact: true });
  await controls.getByRole('button', { name: 'الوضع الداكن', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(controls.getByRole('button', { name: 'الوضع الداكن', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 940 });
    for (const route of [
      '/',
      '/community',
      '/#university-community',
      '/help',
      '/faq',
      '/privacy',
      '/about',
      '/courses',
      '/store',
    ]) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(result.violations, route + ' dark ' + width).toEqual([]);
      if (['/', '/help', '/privacy', '/community'].includes(route))
        await page.screenshot({
          path: test
            .info()
            .outputPath(`public-dark-${route === '/' ? 'home' : route.slice(1)}-${width}.png`),
          fullPage: true,
        });
    }
  }
  await page.goto('/privacy');
  await page.evaluate(() =>
    document
      .querySelectorAll<HTMLDetailsElement>('.privacy-accordion details')
      .forEach((detail) => {
        detail.open = true;
      }),
  );
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.privacy-copy p').first()).toHaveCSS('color', 'rgb(48, 79, 95)');
  await page.pdf({
    path: test.info().outputPath('privacy-dark-print.pdf'),
    format: 'A4',
    printBackground: true,
  });
  await page.emulateMedia({ media: 'screen' });
  await page.goto('/');
  await page.getByRole('button', { name: 'فتح القائمة', exact: true }).click();
  await expect(
    page.getByRole('navigation', { name: 'القائمة الرئيسية', exact: true }),
  ).toBeVisible();
  const openMenu = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(openMenu.violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('public-dark-mobile-menu.png') });
  await page.getByRole('button', { name: 'إغلاق القائمة', exact: true }).click();
  await controls.getByRole('button', { name: 'إعدادات الجهاز', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await controls.getByRole('button', { name: 'الوضع الفاتح', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('hub-theme'))).toBe('light');
});
