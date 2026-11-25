import { requireStudentViewer } from '@/lib/session';
import { PersonalCourseForm } from '@/components/personal-course-form';
export const metadata = { title: 'إنشاء دورة تعليمية خاصة' };
export default async function NewPersonalCourse() {
  await requireStudentViewer('/learning/new');
  return <PersonalCourseForm />;
}
