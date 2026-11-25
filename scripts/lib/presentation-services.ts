import type { db as Database } from '../../src/db';
import * as s from '../../src/db/schema';
import { and, eq } from 'drizzle-orm';
// Stable presentation-v2 IDs. Does not alter existing users, credentials or grants.
export async function seedPresentationServices(db: typeof Database) {
  const [owner] = await db
    .select({ id: s.user.id })
    .from(s.user)
    .innerJoin(s.platformAdmins, eq(s.platformAdmins.userId, s.user.id))
    .where(eq(s.user.email, 'demo.admin@studenthub.test'))
    .limit(1);
  if (!owner) return;
  await db.transaction(async (tx) => {
    const common = {
      institutionId: 'presentation-v1-services',
      department: 'private_sector',
      authorId: owner.id,
      published: true,
      demo: false,
    };
    await tx
      .insert(s.portalEntries)
      .values([
        {
          ...common,
          id: 'presentation-v2-product-notebook',
          kind: 'product',
          title: 'دفتر محاضرات جامعي',
          description: 'دفتر مسطر لتنظيم ملاحظات المحاضرات والمراجعة، 120 ورقة بغلاف مقوى.',
          category: 'أدوات دراسية',
          priceMinor: 8500,
          capacity: 80,
          imageUrl: '/design/student-store-hero.jpg',
        },
        {
          ...common,
          id: 'presentation-v2-product-planner',
          kind: 'product',
          title: 'منظم الأسبوع الدراسي',
          description:
            'مخطط أسبوعي للمحاضرات والواجبات والمواعيد، مع مساحة لتحديد الأهداف والملاحظات.',
          category: 'أدوات دراسية',
          priceMinor: 6000,
          capacity: 60,
        },
        {
          ...common,
          id: 'presentation-v2-product-tools',
          kind: 'product',
          title: 'مجموعة أدوات هندسية',
          description: 'مسطرة ومثلثان ومنقلة وأدوات رسم للمحاضرات والتطبيقات العملية.',
          category: 'أدوات دراسية',
          priceMinor: 12000,
          capacity: 35,
        },
        {
          ...common,
          id: 'presentation-v2-link-project',
          kind: 'service',
          opportunityType: 'internship',
          title: 'مسار تطوير الويب',
          provider: 'مركز مهارات الطلاب',
          description:
            'مسار عملي لتعلم واجهات الويب والعمل ضمن مجموعة تعلم، مع مشروع ختامي ومراجعة أسبوعية.',
          requirements: 'أساسيات البرمجة، جهاز حاسب، والالتزام بمتابعة المهام الأسبوعية.',
          category: 'تطوير المهارات',
          location: 'عن بُعد',
          capacity: 30,
        },
        {
          ...common,
          id: 'presentation-v2-link-research',
          kind: 'service',
          opportunityType: 'job',
          title: 'مساعد تنظيم محتوى تعليمي',
          provider: 'فريق المحتوى الطلابي',
          description:
            'المشاركة في ترتيب المراجع والملاحظات وتنسيقها لتسهيل الوصول إلى مصادر التعلم.',
          requirements: 'مهارات تنظيم وكتابة واضحة والقدرة على العمل مع الفريق.',
          category: 'عمل طلابي',
          location: 'عن بُعد',
          capacity: 8,
        },
        {
          ...common,
          id: 'presentation-v2-poll-workshop',
          kind: 'poll',
          title: 'ما الورشة التي تود حضورها؟',
          description: 'شاركنا اختيارك لموضوع ورشة مهارات الطلاب القادمة.',
          category: 'مهارات الطلاب',
          closesAt: new Date('2027-06-01T18:00:00Z'),
        },
        {
          ...common,
          id: 'presentation-v2-poll-campus',
          kind: 'poll',
          title: 'ما الخدمة الأكثر أهمية ليومك الجامعي؟',
          description: 'اختر الخدمة التي تستخدمها لتخطيط يومك الدراسي.',
          category: 'الحياة الجامعية',
          closesAt: new Date('2027-06-01T18:00:00Z'),
        },
      ])
      .onConflictDoNothing();
    for (const [id, options] of [
      ['workshop', ['تطوير الويب', 'تحليل البيانات', 'مهارات العرض']],
      ['campus', ['تنظيم المقررات', 'الأنشطة الطلابية', 'الموارد التعليمية']],
    ] as const)
      await tx
        .insert(s.pollOptions)
        .values(
          options.map((label, i) => ({
            id: 'presentation-v2-poll-' + id + '-' + i,
            entryId: 'presentation-v2-poll-' + id,
            label,
          })),
        )
        .onConflictDoNothing();
    const [inst] = await tx
      .select()
      .from(s.institutions)
      .where(
        and(eq(s.institutions.universityId, 'demo-university'), eq(s.institutions.active, true)),
      )
      .limit(1);
    if (inst) {
      await tx
        .insert(s.courses)
        .values({
          id: 'presentation-v2-course',
          universityId: 'demo-university',
          title: 'مشروع تطبيقات الويب',
          description:
            'بناء تطبيق طلابي بسيط من الفكرة إلى واجهة قابلة للاستخدام، مع تقسيم الأدوار ومراجعة العمل.',
          category: 'علوم الحاسب',
          instructor: 'فريق مهارات الطلاب',
          published: true,
        })
        .onConflictDoNothing();
      await tx
        .insert(s.resources)
        .values([
          {
            id: 'presentation-v2-lesson',
            courseId: 'presentation-v2-course',
            title: 'تخطيط المشروع وتقسيم الأدوار',
            kind: 'lecture',
            body: 'حدد المشكلة والمستخدمين أولًا، ثم ارسم شاشات التطبيق الأساسية. قسّم العمل إلى مهام صغيرة لكل منها مسؤول وموعد تسليم. راجع التقدم مع الفريق أسبوعيًا.',
            position: 1,
          },
          {
            id: 'presentation-v2-assignment',
            courseId: 'presentation-v2-course',
            title: 'خطة المشروع الأولى',
            kind: 'assignment',
            body: 'اكتب وصف المشكلة والجمهور المستهدف، وحدد ثلاث شاشات أساسية وخطة توزيع المهام بين أعضاء الفريق.',
            position: 2,
          },
        ])
        .onConflictDoNothing();
      await tx
        .insert(s.teamCourseSettings)
        .values({
          courseId: 'presentation-v2-course',
          facultyId: 'demo-computing',
          institutionId: inst.id,
          universityId: 'demo-university',
          enabled: true,
          maxMembers: 5,
          conditions: 'خمسة أعضاء كحد أقصى، مع توزيع واضح للمهام ومتابعة أسبوعية.',
          updatedBy: owner.id,
        })
        .onConflictDoNothing();
      await tx
        .insert(s.portalEntries)
        .values({
          ...common,
          id: 'presentation-v2-team-web',
          institutionId: inst.id,
          universityId: 'demo-university',
          facultyId: 'demo-computing',
          department: 'student_union',
          kind: 'team',
          teamCourseId: 'presentation-v2-course',
          teamMarker: 'A',
          title: 'فريق تطبيقات الويب',
          description:
            'نعمل على تطبيق لتنظيم اليوم الجامعي، ونستقبل مهتمين بالتصميم والبرمجة والاختبار.',
          category: 'مشروعات برمجية',
          capacity: 5,
        })
        .onConflictDoNothing();
    }
    const [student] = await tx
      .select({ id: s.user.id })
      .from(s.user)
      .where(eq(s.user.email, 'demo.student@studenthub.test'))
      .limit(1);
    if (student) {
      await tx
        .insert(s.personalLearningCourses)
        .values({
          id: 'presentation-v2-private-course',
          userId: student.id,
          title: 'رحلتي في تعلم البرمجة',
          description: 'خطة شخصية لمراجعة أساسيات البرمجة وحل التمارين وتسجيل الملاحظات.',
          status: 'active',
        })
        .onConflictDoNothing();
      await tx
        .insert(s.personalLearningResources)
        .values([
          {
            id: 'presentation-v2-private-note',
            courseId: 'presentation-v2-private-course',
            title: 'خطة الأسبوع الأول',
            body: 'مراجعة المتغيرات والشروط والحلقات، ثم حل ثلاثة تمارين قصيرة وتسجيل الأسئلة.',
            position: 1,
          },
          {
            id: 'presentation-v2-private-practice',
            courseId: 'presentation-v2-private-course',
            title: 'ملاحظات التدريب العملي',
            body: 'ابدأ بحل بسيط، اختبر المدخلات المختلفة ثم حسّن الأسماء وتقسيم الدوال.',
            position: 2,
          },
        ])
        .onConflictDoNothing();
    }
  });
}
