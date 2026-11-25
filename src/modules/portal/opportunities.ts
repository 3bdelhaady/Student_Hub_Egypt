import { z } from 'zod';
export const opportunityTypes = ['job', 'internship', 'scholarship'] as const;
export const opportunityLabels = { job: 'الوظائف', internship: 'التدريبات', scholarship: 'المنح' };
export const opportunityInput = z.object({
  opportunityType: z.enum(['', ...opportunityTypes]).default(''),
  provider: z.string().trim().max(160).default(''),
  requirements: z.string().trim().max(6000).default(''),
});
export type Opportunity = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  opportunityType: string;
  provider: string;
  requirements: string;
  closesAt: Date | null;
  demo?: boolean;
};
// Owner-approved page-only fixtures. Remove this array to remove every mock opportunity.
export const demoOpportunities: Opportunity[] = [
  {
    id: 'student-link-demo-ui',
    title: 'ديمو: مطور واجهات مبتدئ',
    description:
      'فرصة وهمية لتجربة صفحة الوظائف، العمل ضمن فريق لتطوير واجهات ويب متجاوبة واختبار تجربة المستخدم.',
    category: 'دوام جزئي',
    location: 'الأقصر',
    opportunityType: 'job',
    provider: 'فريق تقني افتراضي',
    requirements:
      'معرفة أساسية بـ HTML وCSS وJavaScript، مشروع شخصي واحد على الأقل، القدرة على التعلم والعمل مع الفريق.',
    closesAt: null,
    demo: true,
  },
  {
    id: 'student-link-demo-data',
    title: 'ديمو: محلل بيانات ناشئ',
    description:
      'نموذج وظيفة لتحويل البيانات إلى تقارير ولوحات متابعة، لا توجد شركة أو وظيفة فعلية وراء هذا الإعلان.',
    category: 'عن بُعد',
    location: 'عن بُعد',
    opportunityType: 'job',
    provider: 'مختبر بيانات افتراضي',
    requirements: 'أساسيات الجداول وSQL، والقدرة على شرح النتائج بوضوح.',
    closesAt: null,
    demo: true,
  },
  {
    id: 'student-link-demo-admin',
    title: 'ديمو: مساعد إداري',
    description: 'نموذج فرصة لتنظيم المواعيد والملفات وإعداد التقارير داخل فريق افتراضي.',
    category: 'دوام جزئي',
    location: 'قنا',
    opportunityType: 'job',
    provider: 'مكتب افتراضي',
    requirements: 'تنظيم الوقت، مهارات التواصل واستخدام برامج المستندات والجداول.',
    closesAt: null,
    demo: true,
  },
  {
    id: 'student-link-demo-security',
    title: 'ديمو: تدريب الأمن السيبراني',
    description:
      'مسار تدريبي وهمي لتجربة عرض فرص التدريب، يتناول مبادئ حماية الأنظمة والعمل داخل مختبر تعليمي.',
    category: 'تدريب صيفي',
    location: 'الأقصر',
    opportunityType: 'internship',
    provider: 'أكاديمية تدريب افتراضية',
    requirements: 'أساسيات الشبكات ونظم التشغيل، لا تحتاج خبرة عمل سابقة.',
    closesAt: null,
    demo: true,
  },
  {
    id: 'student-link-demo-web',
    title: 'ديمو: تدريب تطوير الويب',
    description: 'نموذج تدريب لبناء واجهة تطبيق ومراجعة الكود ضمن مجموعة تعلم افتراضية.',
    category: 'تدريب عملي',
    location: 'قنا',
    opportunityType: 'internship',
    provider: 'معمل تعلم افتراضي',
    requirements: 'أساسيات البرمجة والاستعداد لتنفيذ مشروع صغير.',
    closesAt: null,
    demo: true,
  },
  {
    id: 'student-link-demo-merit',
    title: 'ديمو: منحة التفوق الأكاديمي',
    description: 'نموذج منحة لتجربة التفاصيل والشروط، ليست منحة حقيقية ولا تمنح تمويلًا أو قبولًا.',
    category: 'دعم دراسي',
    location: 'مصر',
    opportunityType: 'scholarship',
    provider: 'صندوق تعليمي افتراضي',
    requirements: 'هذا مثال توضيحي لشروط المنح، وليس طلبًا لتقديم أوراق أو إثبات درجات.',
    closesAt: null,
    demo: true,
  },
  {
    id: 'student-link-demo-research',
    title: 'ديمو: منحة مشروع بحثي',
    description: 'نموذج فرصة دعم مشروع بحثي طلابي داخل جهة افتراضية، للعرض وتجربة التصفح فقط.',
    category: 'دعم بحثي',
    location: 'عن بُعد',
    opportunityType: 'scholarship',
    provider: 'مركز بحثي افتراضي',
    requirements: 'فكرة مشروع وخطة مختصرة، في هذا النموذج لا تُرسل أي مستندات.',
    closesAt: null,
    demo: true,
  },
];
export function opportunityType(value: string) {
  return opportunityTypes.includes(value as (typeof opportunityTypes)[number])
    ? (value as (typeof opportunityTypes)[number])
    : null;
}
