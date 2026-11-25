import type { db as Database } from '../../src/db';
import * as s from '../../src/db/schema';
import { randomBytes } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
export async function seedStoreReviewAgent(
  db: typeof Database,
  credentials: Record<string, { email: string; password: string }>,
) {
  if (process.env.DATABASE_URL || process.env.DEMO_MODE !== 'true')
    throw new Error('Local disposable fixture only');
  const id = crypto.randomUUID(),
    email = 'store-review-' + id + '@example.test',
    password = randomBytes(24).toString('base64url');
  await db.insert(s.user).values({ id, email, name: 'وكيل متجر محلي للاختبار' });
  await db.insert(s.account).values({
    id: crypto.randomUUID(),
    userId: id,
    accountId: id,
    providerId: 'credential',
    createdAt: new Date(),
    updatedAt: new Date(),
    password: await hashPassword(password),
  });
  await db.insert(s.institutionAgents).values({
    id: crypto.randomUUID(),
    userId: id,
    institutionId: 'review-demo-store',
    department: 'private_sector',
    position: 'representative',
    status: 'active',
    canRead: true,
    canEdit: true,
    canPublish: true,
    sectionPermissions: Object.fromEntries(
      ['product', 'housing', 'restaurant', 'ticket'].map((k) => [
        k,
        { canRead: true, canEdit: true, canPublish: true },
      ]),
    ),
  });

  const { eq } = await import('drizzle-orm');
  await db
    .update(s.portalEntries)
    .set({ authorId: id })
    .where(eq(s.portalEntries.institutionId, 'review-demo-store'));
  await db
    .update(s.portalEntries)
    .set({
      restaurantDetails: {
        open: 'open',
        logo: '',
        cover: '',
        delivery: '',
        opensAt: '',
        closesAt: '',
        hours: '',
        mapUrl: '',
        phone: '',
        website: '',
        menu: [
          {
            id: 'review-meal',
            title: 'وجبة فحص محلية',
            description: '',
            category: 'وجبات',
            priceMinor: 8500,
            imageUrl: '',
            available: true,
          },
        ],
      },
    })
    .where(eq(s.portalEntries.id, 'review-demo-v1-restaurant'));
  const studentId = crypto.randomUUID(),
    studentEmail = 'review-student-' + studentId + '@example.test',
    studentPassword = randomBytes(24).toString('base64url');
  await db
    .insert(s.user)
    .values({ id: studentId, email: studentEmail, name: 'طالب مراجعة الديمو المحلي' });
  await db.insert(s.account).values({
    id: crypto.randomUUID(),
    userId: studentId,
    accountId: studentId,
    providerId: 'credential',
    createdAt: new Date(),
    updatedAt: new Date(),
    password: await hashPassword(studentPassword),
  });
  await db.insert(s.memberships).values({
    id: crypto.randomUUID(),
    userId: studentId,
    universityId: 'demo-university',
    facultyId: 'demo-computing',
    faculty: 'كلية الحاسبات',
    role: 'student',
    status: 'active',
  });
  credentials.reviewstudent = { email: studentEmail, password: studentPassword };
  credentials.storereview = { email, password };
}
