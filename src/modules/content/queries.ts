import { viewer } from '@/lib/session';
import { studentCourseScopeSql } from '@/modules/agent-academic/queries';
import { db } from '@/db';
import { courses, posts } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
export const publicCourses = async () => {
  const v = await viewer();
  return db
    .select()
    .from(courses)
    .where(and(eq(courses.published, true), studentCourseScopeSql(v?.membership)))
    .orderBy(desc(courses.createdAt));
};
export const publicPosts = () =>
  db.select().from(posts).where(eq(posts.published, true)).orderBy(desc(posts.createdAt));
