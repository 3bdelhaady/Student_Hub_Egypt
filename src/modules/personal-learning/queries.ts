import { db } from '@/db';
import {
  personalLearningCourses as courses,
  personalLearningResources as resources,
} from '@/db/schema';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
export function personalCourseList(userId: string) {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      status: courses.status,
      total: sql<number>`count(${resources.id})::int`,
      completed: sql<number>`count(${resources.completedAt})::int`,
    })
    .from(courses)
    .leftJoin(resources, eq(resources.courseId, courses.id))
    .where(eq(courses.userId, userId))
    .groupBy(courses.id)
    .orderBy(desc(courses.updatedAt));
}
export async function personalCourseDetail(userId: string, id: string) {
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .limit(1);
  if (!course) return null;
  const items = await db
    .select()
    .from(resources)
    .where(eq(resources.courseId, course.id))
    .orderBy(asc(resources.position), asc(resources.createdAt), asc(resources.id));
  return { course, items };
}
