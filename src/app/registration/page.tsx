import { redirect } from 'next/navigation';
import { db } from '@/db';
import { user, institutions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireViewer } from '@/lib/session';
import { listUniversities, listFaculties } from '@/modules/catalog/queries';
import { AgentRegistrationForm } from '@/components/agent-registration-form';
export const metadata = { title: 'طلب تفعيل حساب الوكيل' };
export default async function Registration() {
  const v = await requireViewer('/registration');
  if (v.institutionAgent) redirect('/agent');
  const [person] = await db.select().from(user).where(eq(user.id, v.user.id)).limit(1);
  if (!person || person.signupKind === 'student') redirect('/account');
  const [universities, faculties, available] = await Promise.all([
    listUniversities(),
    listFaculties(),
    db
      .select({
        id: institutions.id,
        name: institutions.name,
        kind: institutions.kind,
        universityId: institutions.universityId,
      })
      .from(institutions)
      .where(eq(institutions.active, true)),
  ]);
  return (
    <section className="section narrow">
      <h1>استكمال طلب تفعيل حساب الوكيل</h1>
      <p>
        حساب الدخول موجود بالفعل، أكمل نطاق العمل لإرسال الطلب إلى أدمن المنصة، دون إنشاء حساب آخر.
      </p>
      <AgentRegistrationForm
        kind={person.signupKind}
        universities={universities}
        faculties={faculties}
        institutions={available}
      />
    </section>
  );
}
