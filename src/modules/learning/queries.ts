import { viewer } from '@/lib/session';
import { studentCourseScopeSql } from '@/modules/agent-academic/queries';
import { db } from '@/db';
import { courses, savedCourses } from '@/db/schema';
import { and, asc, eq } from 'drizzle-orm';

export async function savedCourseNavigation(userId: string) {
  const v = await viewer();
  return db
    .select({ id: courses.id, title: courses.title })
    .from(savedCourses)
    .innerJoin(courses, eq(savedCourses.courseId, courses.id))
    .where(
      and(
        eq(savedCourses.userId, userId),
        eq(courses.published, true),
        studentCourseScopeSql(v?.membership),
      ),
    )
    .orderBy(asc(courses.title));
}
