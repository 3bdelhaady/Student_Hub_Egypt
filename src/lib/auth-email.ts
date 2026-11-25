import { reportFailure } from './diagnostics';
export function authEmailContent(kind: 'verify' | 'reset', url: string, origin: string) {
  const link = new URL(url);
  if (link.origin !== new URL(origin).origin || !link.pathname.startsWith('/api/auth/'))
    throw Error('Invalid authentication link');
  const action = kind === 'verify' ? 'تأكيد بريدك الإلكتروني' : 'إعادة تعيين كلمة المرور';
  return {
    subject: `مركز الطلاب: ${action}`,
    text: `${action}\n\n${link.href}\n\nإذا لم تطلب ذلك، تجاهل هذه الرسالة. لا تشارك هذا الرابط مع أي شخص.`,
  };
}
export async function sendAuthEmail(
  kind: 'verify' | 'reset',
  email: string,
  url: string,
  origin: string,
) {
  const content = authEmailContent(kind, url, origin);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM, to: [email], ...content }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw Error('Email delivery failed');
  } catch {
    reportFailure('identity.email-delivery');
    throw Error('Email delivery unavailable');
  }
}
