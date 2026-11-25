import { emailSecurityConfig } from '@/modules/identity/email-security';
import { AuthForm } from '@/components/auth-form';
import { AuthScreen } from '@/components/auth-screen';
export const metadata = { title: 'تسجيل الدخول' };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthScreen>
      <AuthForm emailSecurity={emailSecurityConfig().enabled} mode="login" next={next} />
    </AuthScreen>
  );
}
