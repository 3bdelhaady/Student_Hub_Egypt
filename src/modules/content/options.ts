export const courseCategories = [
  'العلوم الأساسية',
  'علوم الحاسب',
  'تطوير المهارات',
  'الهندسة',
  'العلوم الإنسانية',
  'إدارة وأعمال',
  'لغات',
];
export const postCategories = [
  'أخبار المجتمع',
  'إعلانات أكاديمية',
  'تعلم وتطوير',
  'تدريب وعمل',
  'تطوع ومشاركة',
  'فعاليات وأنشطة',
];
export const categoryOptions = (defaults: string[], existing: string[]) => [
  ...new Set([...defaults, ...existing.filter(Boolean)]),
];
