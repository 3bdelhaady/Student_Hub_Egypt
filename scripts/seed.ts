import { sql } from 'drizzle-orm';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
async function main() {
  if (process.env.DEMO_MODE !== 'true') throw Error('Seed requires configured application mode');
  const { db } = await import('../src/db');
  const s = await import('../src/db/schema');
  await db
    .insert(s.universities)
    .values([
      { id: 'demo-university', name: 'جامعة قنا الأهلية', city: 'قنا', governorate: 'قنا' },
      {
        id: 'luxor-national',
        name: 'جامعة الأقصر الأهلية',
        city: 'طيبة الجديدة، الأقصر',
        governorate: 'الأقصر',
      },
    ])
    .onConflictDoNothing();
  await db
    .insert(s.faculties)
    .values([
      {
        id: 'demo-computing',
        universityId: 'demo-university',
        name: 'كلية الحاسبات والذكاء الاصطناعي',
      },
      { id: 'demo-engineering', universityId: 'demo-university', name: 'كلية الهندسة' },
      { id: 'qena-medicine', universityId: 'demo-university', name: 'كلية الطب' },
      { id: 'qena-pharmacy', universityId: 'demo-university', name: 'كلية الصيدلة' },
      { id: 'qena-physiotherapy', universityId: 'demo-university', name: 'كلية العلاج الطبيعي' },
      { id: 'qena-nursing', universityId: 'demo-university', name: 'كلية التمريض' },
      { id: 'qena-languages', universityId: 'demo-university', name: 'كلية الألسن' },
      {
        id: 'demo-commerce',
        universityId: 'demo-university',
        name: 'كلية العلوم الإدارية والمالية',
      },
      {
        id: 'luxor-computing',
        universityId: 'luxor-national',
        name: 'كلية الحاسبات والمعلومات والذكاء الاصطناعي',
      },
      { id: 'luxor-tourism', universityId: 'luxor-national', name: 'كلية السياحة والآثار' },
      {
        id: 'luxor-languages',
        universityId: 'luxor-national',
        name: 'كلية اللغات والترجمة والعلوم الإنسانية',
      },
      { id: 'luxor-arts', universityId: 'luxor-national', name: 'كلية الفنون والتصميم' },
    ])
    .onConflictDoNothing();
  await db
    .insert(s.institutions)
    .values([
      {
        id: 'demo-institution',
        governorate: 'قنا',
        universityId: 'demo-university',
        name: 'جامعة قنا الأهلية',
        kind: 'university',
        description: 'مساحة مجتمع طلاب جامعة قنا الأهلية على Student Hub.',
        website: 'https://www.svnu.edu.eg',
        demo: false,
      },
      {
        id: 'luxor-institution',
        governorate: 'الأقصر',
        universityId: 'luxor-national',
        name: 'جامعة الأقصر الأهلية',
        kind: 'university',
        description: 'مساحة مجتمع طلاب جامعة الأقصر الأهلية على Student Hub.',
        website: 'https://lnu.edu.eg/home/',
        demo: false,
      },
      {
        id: 'demo-library',
        name: 'مصادر التعلم',
        kind: 'private_sector',
        description: 'محتوى تعليمي ومراجع للمذاكرة وتنظيم المعرفة.',
        demo: false,
      },
      {
        id: 'demo-training',
        name: 'التطوير المهني',
        kind: 'private_sector',
        description: 'مقالات ومهارات للتعلم والعمل وبناء المسار المهني.',
        demo: false,
      },
    ])
    .onConflictDoNothing();
  await db
    .insert(s.studentOrganizations)
    .values([
      {
        id: 'demo-union-computing',
        institutionId: 'demo-institution',
        universityId: 'demo-university',
        facultyId: 'demo-computing',
        kind: 'student_union',
        name: 'اتحاد طلاب الحاسبات',
      },
      {
        id: 'demo-activity-computing',
        institutionId: 'demo-institution',
        universityId: 'demo-university',
        facultyId: 'demo-computing',
        kind: 'student_activity',
        name: 'نادي الابتكار الطلابي',
      },
    ])
    .onConflictDoNothing();
  const { ensureDefaultUnions } = await import('../src/modules/institution/default-unions');
  await db.transaction(async (tx) => {
    await ensureDefaultUnions(tx);
  });
  await db
    .insert(s.courses)
    .values([
      {
        id: 'math-2',
        universityId: 'demo-university',
        title: 'الرياضيات ٢',
        description: 'المعادلات التفاضلية والجبر الخطي، من المفاهيم الأساسية إلى حل المسائل.',
        category: 'العلوم الأساسية',
        instructor: 'فريق المحتوى',
        published: true,
      },
      {
        id: 'programming',
        universityId: 'demo-university',
        title: 'أساسيات البرمجة',
        description: 'تعلّم التفكير المنطقي والخوارزميات والمدخلات والمخرجات وبناء برامج صغيرة.',
        category: 'علوم الحاسب',
        instructor: 'فريق المحتوى',
        published: true,
      },
      {
        id: 'communication',
        universityId: 'demo-university',
        title: 'مهارات التواصل',
        description: 'نظّم أفكارك وقدّمها بوضوح، وطوّر مهارات العرض والعمل الجماعي.',
        category: 'تطوير المهارات',
        instructor: 'فريق المحتوى',
        published: true,
      },
    ])
    .onConflictDoNothing();
  // Owner confirmed these original demo courses belong to Computing and AI.
  await db.execute(
    sql.raw(`INSERT INTO agent_course_scopes(course_id,institution_id,university_id,faculty_id,organization_id,department)
    SELECT c.id,o.institution_id,c.university_id,o.faculty_id,o.id,'student_union'
    FROM courses c JOIN student_organizations o ON o.id='demo-union-computing' AND o.university_id=c.university_id AND o.faculty_id='demo-computing' AND o.kind='student_union'
    WHERE c.id IN ('math-2','programming','communication','presentation-v2-course') AND c.university_id='demo-university' ON CONFLICT(course_id) DO NOTHING`),
  );
  await db
    .insert(s.resources)
    .values([
      {
        id: 'math-intro',
        courseId: 'math-2',
        title: 'المحاضرة الأولى: مقدمة في المعادلات التفاضلية',
        kind: 'lecture',
        body: 'المعادلة التفاضلية تربط دالة بمشتقاتها، رتبة المعادلة هي أعلى رتبة مشتقة تظهر فيها.\n\nمثال: dy/dx = 2x معادلة من الرتبة الأولى، بالتكامل نحصل على y = x² + C، ثابت التكامل C يتحدد إذا عُرفت قيمة ابتدائية للدالة.\n\nتدريب: تحقق بالتعويض أن y = Ceˣ يحل المعادلة dy/dx = y، ثم أوجد C عندما y(0) = 3.',
        position: 1,
      },
      {
        id: 'math-notes',
        courseId: 'math-2',
        title: 'ملخص المراجعة الأولى',
        kind: 'file',
        body: 'راجع قواعد الاشتقاق والتكامل قبل البدء.\n\nاشتقاق xⁿ يساوي nxⁿ⁻¹، وتكامل xⁿ يساوي xⁿ⁺¹/(n+1) + C عندما n لا يساوي -1.\n\nفي فصل المتغيرات، اجمع حدود المتغير التابع مع تفاضله في طرف، وحدود المتغير المستقل في الطرف الآخر، ثم كامل الطرفين، لا تنس فحص الحلول الثابتة التي قد تُفقد عند القسمة.',
        position: 2,
      },
      {
        id: 'code-intro',
        courseId: 'programming',
        title: 'المحاضرة الأولى: التفكير كالمبرمج',
        kind: 'lecture',
        body: 'ابدأ بتحديد المشكلة والمدخلات والمخرجات المطلوبة.\n\nلحساب متوسط ثلاث درجات: اقرأ a وb وc، احسب المجموع s = a + b + c، ثم اطبع s / 3.\n\nجرّب حالات مختلفة: ثلاث درجات متساوية، درجة صفر، ودرجات عشرية، اكتب توقعك قبل تشغيل البرنامج ثم قارنه بالنتيجة.',
        position: 1,
      },
      {
        id: 'comm-intro',
        courseId: 'communication',
        title: 'المحاضرة الأولى: الفكرة الواضحة',
        kind: 'lecture',
        body: 'حدد فكرة واحدة تريد أن يتذكرها المستمع، ابدأ بها، وادعمها بمثال، ثم اختم بخطوة عملية.\n\nقبل العرض، اسأل نفسك: من الجمهور؟ ما معرفته الحالية؟ وما القرار أو الفهم الذي أريده بعد العرض؟\n\nتدريب: اشرح مشروعك الدراسي في دقيقة واحدة لزميل من تخصص آخر، واطلب منه أن يعيد الفكرة بكلماته.',
        position: 1,
      },
    ])
    .onConflictDoNothing();
  await db
    .insert(s.posts)
    .values([
      {
        id: 'welcome',
        universityId: 'demo-university',
        title: 'مساحة واحدة لكل ما يهمك في الجامعة',
        excerpt: 'نظّم مقرراتك وتابع تقدمك، وابدأ من مجتمعك الجامعي.',
        body: 'ابدأ بإنشاء حساب واختيار الجامعة والكلية، ثم تابع حالة طلب عضويتك من حسابك.\n\nبعد التفعيل، افتح المقررات المتاحة، واحفظ ما تريد الرجوع إليه، حدد الموارد المكتملة لتتابع تقدمك خطوة بخطوة.',
        kind: 'news',
        category: 'دليل المنصة',
        published: true,
      },
      {
        id: 'design-workshop',
        universityId: 'demo-university',
        title: 'من الفكرة إلى أول تصميم',
        excerpt: 'دليل عملي لتحديد المشكلة ورسم أول تصور لحلها.',
        body: 'ابدأ بمشكلة محددة يواجهها مستخدم حقيقي، اسأله عما يحاول فعله وما يعرقله، ثم اكتب الهدف في جملة واحدة.\n\nارسم ثلاث أفكار على الورق قبل استخدام أي أداة، اختر أبسطها، واعرضها على شخص آخر دون شرح مطول، راقب أين يتوقف، ثم حسّن التصميم.',
        kind: 'news',
        category: 'التصميم والتعلم',
        published: true,
      },
      {
        id: 'volunteer',
        universityId: 'demo-university',
        title: 'العمل الجماعي: اتفاق واضح من البداية',
        excerpt: 'كيف توزّع المهام وتتابع تقدم فريقك في مشروع دراسي.',
        body: 'حددوا نتيجة قابلة للقياس، ثم قسّموا العمل إلى مهام صغيرة، لكل مهمة مسؤول وموعد متفق عليه.\n\nاتفقوا على طريقة مشاركة الملفات وتسمية النسخ، في كل متابعة قصيرة، ناقشوا ما تم وما تعطل والخطوة التالية، احتفظوا بالقرارات في مكان واحد.',
        kind: 'news',
        category: 'مهارات الفريق',
        published: true,
      },
    ])
    .onConflictDoNothing();
  const { seedReviewDemos } = await import('./lib/review-demos');
  await seedReviewDemos(db);
  console.log('Catalog initialized; No users or credentials changed.');
  const { seedPresentationCatalog } = await import('./lib/presentation-catalog');
  await seedPresentationCatalog(db);
  const { seedPresentationServices } = await import('./lib/presentation-services');
  await seedPresentationServices(db);
  process.exit(0);
}
main().catch(() => {
  console.error('Catalog initialization failed');
  process.exit(1);
});
