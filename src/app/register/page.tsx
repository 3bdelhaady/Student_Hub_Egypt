import { emailSecurityConfig } from '@/modules/identity/email-security';
import { db } from '@/db';
import { institutions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AuthForm } from '@/components/auth-form';
import { AuthScreen } from '@/components/auth-screen';
import { listUniversities, listFaculties } from '@/modules/catalog/queries';
export const metadata = { title: 'إنشاء حساب جديد' };
export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const [universities, faculties, availableInstitutions] = await Promise.all([
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
    <AuthScreen register>
      <AuthForm
        emailSecurity={emailSecurityConfig().enabled}
        mode="register"
        next={next}
        universities={universities}
        faculties={faculties}
        institutions={availableInstitutions}
      />
    </AuthScreen>
  );
}
