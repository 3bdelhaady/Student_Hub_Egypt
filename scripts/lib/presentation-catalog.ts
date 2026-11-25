import type { db as Database } from '../../src/db';
import * as s from '../../src/db/schema';
import { eq } from 'drizzle-orm';
// Owner-requested presentation catalog, Nov 24 2026. Stable IDs allow later removal.
// No account, credential, role, grant or existing listing is changed here.
export async function seedPresentationCatalog(db: typeof Database) {
  const [owner] = await db
    .select({ id: s.user.id })
    .from(s.user)
    .innerJoin(s.platformAdmins, eq(s.platformAdmins.userId, s.user.id))
    .where(eq(s.user.email, 'demo.admin@studenthub.test'))
    .limit(1);
  if (!owner) return;
  await db.transaction(async (tx) => {
    await tx
      .insert(s.institutions)
      .values([
        {
          id: 'presentation-v1-services',
          name: 'خدمات الحياة الجامعية',
          kind: 'private_sector',
          description: 'السكن والأنشطة الطلابية في مكان واحد.',
        },
        {
          id: 'presentation-v1-qena-dining',
          name: 'مائدة الجامعة',
          kind: 'private_sector',
          category: 'restaurant',
          governorate: 'قنا',
          description: 'اختيارات متنوعة لوجبات اليوم الجامعي.',
        },
      ])
      .onConflictDoNothing();
    const housing = {
      type: 'room' as const,
      audience: 'male' as const,
      rooms: 3,
      beds: 2,
      residents: 2,
      furnished: 'yes' as const,
      cooling: 'yes' as const,
      water: true,
      gas: true,
      electricity: true,
      wifi: true,
      deposit: 1500,
      serviceFee: 0,
      mapUrl: '',
      gallery: ['https://student-hub-egypt.vercel.app/catalog/housing.svg'],
    };
    const menu = [
      {
        id: 'chicken-rice',
        title: 'وجبة دجاج مشوي وأرز',
        description: 'دجاج مشوي مع أرز وسلطة موسمية.',
        category: 'الوجبات',
        priceMinor: 12500,
        imageUrl: 'https://student-hub-egypt.vercel.app/catalog/meal.svg',
        available: true,
      },
      {
        id: 'pasta',
        title: 'مكرونة بالصوص الأحمر',
        description: 'مكرونة مع صلصة طماطم وخضروات.',
        category: 'الوجبات',
        priceMinor: 6500,
        imageUrl: 'https://student-hub-egypt.vercel.app/catalog/meal.svg',
        available: true,
      },
      {
        id: 'sandwich',
        title: 'ساندوتش دجاج',
        description: 'خبز طازج ودجاج وخس وصوص.',
        category: 'ساندوتشات',
        priceMinor: 7500,
        imageUrl: 'https://student-hub-egypt.vercel.app/catalog/meal.svg',
        available: true,
      },
      {
        id: 'juice',
        title: 'عصير برتقال',
        description: 'كوب عصير مع الوجبة.',
        category: 'مشروبات',
        priceMinor: 3000,
        imageUrl: 'https://student-hub-egypt.vercel.app/catalog/meal.svg',
        available: true,
      },
    ];
    const rows: Array<
      Omit<typeof s.portalEntries.$inferInsert, 'authorId' | 'department' | 'published'>
    > = [
      {
        id: 'presentation-v1-housing-room',
        institutionId: 'presentation-v1-services',
        kind: 'housing',
        title: 'غرفة مشتركة للطلاب',
        description:
          'غرفة مضيئة بسريرين ومكتبين للمذاكرة، ضمن شقة مفروشة بها مطبخ ومساحة جلوس مشتركة. الإيجار شهري.',
        location: 'قنا، منطقة الجامعة',
        category: 'غرف مشتركة',
        priceMinor: 180000,
        capacity: 8,
        imageUrl: '/catalog/housing.svg',
        housingDetails: housing,
      },
      {
        id: 'presentation-v1-housing-studio',
        institutionId: 'presentation-v1-services',
        kind: 'housing',
        title: 'استوديو هادئ للمذاكرة',
        description:
          'مساحة مستقلة مفروشة، مكتب للمذاكرة ومطبخ صغير وحمام خاص. مناسبة لمن يفضل الخصوصية. الإيجار شهري.',
        location: 'قنا، الحي السكني',
        category: 'استوديو',
        priceMinor: 320000,
        capacity: 3,
        imageUrl: '/catalog/housing.svg',
        housingDetails: {
          ...housing,
          type: 'studio',
          audience: 'all',
          rooms: 1,
          beds: 1,
          residents: 1,
          deposit: 2500,
        },
      },
      {
        id: 'presentation-v1-restaurant-table',
        institutionId: 'presentation-v1-qena-dining',
        kind: 'restaurant',
        title: 'مائدة الجامعة',
        description:
          'وجبات مشوية وساندوتشات ومشروبات تناسب يومك الدراسي. اختر أصنافك من القائمة وأكمل الطلب من السلة.',
        location: 'قنا، منطقة الجامعة',
        category: 'وجبات ومشويات',
        priceMinor: 6500,
        capacity: null,
        imageUrl: '/catalog/meal.svg',
        restaurantDetails: {
          open: 'open',
          logo: '',
          cover: '',
          delivery: 'no',
          opensAt: '',
          closesAt: '',
          hours: 'يوميًا 10 صباحًا إلى 10 مساءً',
          mapUrl: '',
          phone: '',
          website: '',
          menu,
        },
      },
      {
        id: 'presentation-v1-ticket-culture',
        institutionId: 'presentation-v1-services',
        kind: 'ticket',
        ticketType: 'concert',
        title: 'أمسية المواهب الجامعية',
        description:
          'مساحة للموسيقى والشعر والعروض الطلابية، مع فقرات متنوعة لمواهب الجامعة. متابعة تفاصيل المشاركة من داخل المنصة.',
        location: 'قاعة الأنشطة الطلابية',
        category: 'فعاليات ثقافية',
        priceMinor: 7500,
        capacity: 120,
        imageUrl: '/design/ticket-art.jpg',
      },
      {
        id: 'presentation-v1-ticket-trip',
        institutionId: 'presentation-v1-services',
        kind: 'ticket',
        ticketType: 'trip',
        title: 'يوم ترفيهي لطلاب الجامعة',
        description:
          'برنامج جماعي يجمع الأنشطة والألعاب والتعارف بين الطلاب. تشمل التذكرة المشاركة في برنامج اليوم.',
        location: 'مساحة الأنشطة المفتوحة',
        category: 'رحلات وأنشطة',
        priceMinor: 25000,
        capacity: 45,
        imageUrl: '/design/ticket-art.jpg',
      },
    ];
    await tx
      .insert(s.portalEntries)
      .values(
        rows.map((row) => ({
          ...row,
          authorId: owner.id,
          department: 'private_sector',
          published: true,
          demo: false,
        })),
      )
      .onConflictDoNothing();
  });
}
