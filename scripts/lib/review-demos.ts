import type { db as Database } from '../../src/db';
import * as s from '../../src/db/schema';
import { reviewCopy } from './review-copy';
import { eq } from 'drizzle-orm';
export const reviewDemoPrefix = 'review-demo-v1-';
export async function seedReviewDemos(db: typeof Database) {
  const [owner] = await db.select({ id: s.platformAdmins.userId }).from(s.platformAdmins).limit(1);
  if (!owner) return;
  const [disabled] = await db
    .select()
    .from(s.demoProvisionRuns)
    .where(eq(s.demoProvisionRuns.id, 'review-demo-v1-disabled'))
    .limit(1);
  if (disabled) return;
  await db.transaction(async (tx) => {
    const claim = await tx
      .insert(s.demoProvisionRuns)
      .values({ id: 'review-demo-v1-content' })
      .onConflictDoNothing()
      .returning();
    if (!claim.length) return;
    await tx.insert(s.institutions).values([
      {
        id: 'review-demo-store',
        name: 'مكتبة الطالب',
        kind: 'private_sector',
        demo: true,
        description: 'أدوات الدراسة واحتياجات الحياة الجامعية في مكان واحد',
      },
      {
        id: 'review-demo-services',
        name: 'ملتقى الأنشطة الطلابية',
        kind: 'private_sector',
        demo: true,
        description: 'ورش وأنشطة ومجموعات تعلم للطلاب',
      },
    ]);
    const entries = Object.entries(reviewCopy).map(([key, copy]) => ({
      ...copy,
      kind: key === 'trip' ? 'ticket' : key,
      stableId: key,
      priceMinor:
        (
          {
            product: 15000,
            housing: 180000,
            restaurant: 8500,
            ticket: 5000,
            trip: 25000,
            training: 10000,
          } as Record<string, number>
        )[key] ?? 0,
      ticketType: key === 'trip' ? 'trip' : key === 'ticket' ? 'concert' : '',
    }));
    const commerce = ['product', 'housing', 'restaurant', 'ticket', 'trip', 'training'];
    for (const e of entries)
      await tx.insert(s.portalEntries).values({
        ...e,
        id: reviewDemoPrefix + e.stableId,
        institutionId: commerce.includes(e.kind) ? 'review-demo-store' : 'review-demo-services',
        department: 'private_sector',
        title: e.title,
        description: e.description,
        authorId: owner.id,
        published: e.kind !== 'training',
        archived: e.kind === 'training',
        ticketType: e.ticketType,
        capacity: e.kind === 'poll' ? null : 50,
        demo: true,
        teamMarker: e.kind === 'team' ? '📚' : '',
      });
    await tx.insert(s.volunteerDivisions).values([
      {
        id: reviewDemoPrefix + 'volunteer-organization',
        entryId: reviewDemoPrefix + 'volunteer',
        label: 'التنظيم',
        description: 'تنسيق الأنشطة واستقبال المشاركين ومتابعة البرنامج',
        position: 0,
      },
      {
        id: reviewDemoPrefix + 'volunteer-media',
        entryId: reviewDemoPrefix + 'volunteer',
        label: 'الإعلام',
        description: 'إعداد المحتوى وتوثيق الأنشطة ومشاركة أخبار الفريق',
        position: 1,
      },
    ]);
    await tx.insert(s.pollOptions).values(
      ['مهارات الدراسة', 'البرمجة', 'التواصل'].map((label, index) => ({
        id: reviewDemoPrefix + 'poll-' + index,
        entryId: reviewDemoPrefix + 'poll',
        label,
      })),
    );
  });
}
