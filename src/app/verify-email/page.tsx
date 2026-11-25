import { notFound } from 'next/navigation';
import { AuthScreen } from '@/components/auth-screen';
import { EmailSecurityForm } from '@/components/email-security-form';
import { emailSecurityConfig } from '@/modules/identity/email-security';
export const metadata = { title: 'أمان الحساب', robots: { index: false, follow: false } };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  if (!emailSecurityConfig().enabled) notFound();
  const params = await searchParams;
  return (
    <AuthScreen title="تأكيد البريد الإلكتروني">
      <EmailSecurityForm mode="verify" token={params.token} error={params.error} />
    </AuthScreen>
  );
}
