import { notFound } from 'next/navigation';
import { requireViewer } from '@/lib/session';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
export default async function StudentCodeReview({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const v = await requireViewer();
  if (!v.platformAdmin) notFound();
  const params = await searchParams;
  const [record] = params.user
    ? await db
        .select({ code: user.studentCode })
        .from(user)
        .where(eq(user.id, params.user))
        .limit(1)
    : [];
  return (
    <section className="portal-screen">
      <h1>كود الحساب</h1>
      <form>
        <label>
          معرف المستخدم
          <input name="user" required defaultValue={params.user} />
        </label>
        <button className="button primary">عرض</button>
      </form>
      {record?.code ? <p dir="ltr">{record.code}</p> : <p>لم يُنشأ كود لهذا الحساب بعد.</p>}
    </section>
  );
}
