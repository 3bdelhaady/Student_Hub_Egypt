export function emailSecurityConfig(env: Record<string, string | undefined> = process.env) {
  const enabled = env.AUTH_EMAIL_ENABLED === 'true';
  const requiredFrom = env.AUTH_EMAIL_REQUIRED_FROM || '';
  const cutoff = Date.parse(requiredFrom);
  if (enabled && (!Number.isFinite(cutoff) || !env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM))
    throw new Error('Email security requires sender, API key and fixed activation timestamp.');
  return { enabled, requiredFrom: Number.isFinite(cutoff) ? cutoff : Infinity };
}
export function needsEmailVerification(
  person: { emailVerified: boolean; createdAt: Date | string },
  config = emailSecurityConfig(),
) {
  return (
    config.enabled &&
    !person.emailVerified &&
    new Date(person.createdAt).getTime() >= config.requiredFrom
  );
}
