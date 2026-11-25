import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const accounts = JSON.parse(fs.readFileSync('.data/e2e.json', 'utf8'));
const token = fs.readFileSync('.data/integration-test-token', 'utf8');
test('scoped activation API and CSV preserve trust boundaries', async ({ page, request }) => {
  await new Promise((r) => setTimeout(r, 11000));
  const endpoint = '/api/university/activate';
  expect(
    (await request.post(endpoint, { data: { emails: [accounts.apistudent.email] } })).status(),
  ).toBe(401);
  const headers = { authorization: `Bearer ${token}` };
  expect(
    (
      await request.post(endpoint, {
        headers,
        data: { emails: [accounts.apistudent.email], universityId: 'other-university' },
      })
    ).status(),
  ).toBe(400);
  const first = await request.post(endpoint, {
    headers,
    data: {
      emails: [
        accounts.apistudent.email,
        accounts.apistudent.email,
        accounts.rosteroutsider.email,
        accounts.admin.email,
        'unknown@example.test',
      ],
    },
  });
  expect(first.status()).toBe(200);
  expect(await first.json()).toEqual({
    received: 4,
    activated: 1,
    unchangedOrNotEligible: 3,
    demo: true,
  });
  const replay = await request.post(endpoint, {
    headers,
    data: { emails: [accounts.apistudent.email] },
  });
  expect((await replay.json()).activated).toBe(0);
  let limited = false;
  for (let i = 0; i < 11; i++) {
    const r = await request.post(endpoint, { headers, data: { emails: ['unknown@example.test'] } });
    if (r.status() === 429) {
      limited = true;
      expect(r.headers()['retry-after']).toBe('60');
      break;
    }
  }
  expect(limited).toBe(true);
  await page.goto('/login');
  await page.getByLabel('البريد الإلكتروني الجامعي', { exact: true }).fill(accounts.admin.email);
  await page.locator('input[name=password]').fill(accounts.admin.password);
  await page.getByRole('button', { name: 'دخول المنصة', exact: true }).click();
  await expect(page).toHaveURL(/\/(account|courses\/[^/?]+|admin\?tab=institutions)$/);
  await page.goto('/admin?tab=members');
  await page.getByText('استيراد تفعيل من CSV', { exact: true }).click();
  await page.locator('input[name=csv]').setInputFiles({
    name: 'bad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('email,role\n' + accounts.csvstudent.email + ',admin\n'),
  });
  await page.getByRole('button', { name: 'استيراد وتفعيل الطلبات المؤهلة' }).click();
  await expect(page.getByText('تعذر الاستيراد،', { exact: false })).toBeVisible();
  await page.locator('input[name=csv]').setInputFiles({
    name: 'students.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'email\n' + accounts.csvstudent.email + '\n' + accounts.rosteroutsider.email + '\n',
    ),
  });
  await page.getByRole('button', { name: 'استيراد وتفعيل الطلبات المؤهلة' }).click();
  await expect(
    page.getByText('اكتمل الاستيراد: 1 عضويات مفعّلة من 2،', { exact: false }),
  ).toBeVisible();
  const row = page.locator('tr').filter({ hasText: accounts.csvstudent.email });
  await expect(row.getByRole('combobox')).toHaveValue('active');
  const apir = page.locator('tr').filter({ hasText: accounts.apistudent.email });
  await expect(apir.getByRole('combobox')).toHaveValue('active');
  const out = process.env.VISUAL_OUTPUT_DIR || 'test-results/visual';
  fs.mkdirSync(out, { recursive: true });
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    await page.screenshot({ path: path.join(out, `activation-csv-${width}.png`), fullPage: true });
  }
  await page.goto('/admin?tab=audit');
  await expect(
    page.getByText('membership.bulk-activated.csv', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('membership.bulk-activated.api', { exact: true }).first(),
  ).toBeVisible();
});
