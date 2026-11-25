import { studentAreaViewer } from '@/lib/session';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
export default async function Post({ params }: { params: Promise<{ id: string }> }) {
  await studentAreaViewer();
  const { id } = await params;
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.published, true)))
    .limit(1);
  if (!post) notFound();
  return (
    <>
      <div className="page-top">
        <div className="container narrow">
          <div className="breadcrumbs">
            <Link href="/community">الأخبار والفرص</Link>
            <ArrowLeft size={12} />
            <span>{post.kind === 'news' ? 'خبر' : 'فرصة'}</span>
          </div>
          <span className="eyebrow">{post.category}</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
        </div>
      </div>
      <article className="section container narrow">
        <div className="prose">{post.body}</div>
        <hr className="divider" />
        <Link className="text-link" href="/community">
          رجوع للأخبار والفرص
          <ArrowLeft size={17} />
        </Link>
      </article>
    </>
  );
}
