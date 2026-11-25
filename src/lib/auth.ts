import { createStudentCode, parseGender } from '@/modules/identity/student-code';
import { parseSignupKind } from '@/modules/identity/signup-policy';
import { APIError } from 'better-auth/api';
import { emailSecurityConfig, needsEmailVerification } from '@/modules/identity/email-security';
import { sendAuthEmail } from './auth-email';
import { reportFailure } from './diagnostics';
import { eq } from 'drizzle-orm';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';
if (process.env.DEMO_MODE !== 'true')
  throw new Error(
    'This release is demo-only; configure and review live verification, recovery and privacy before enabling production use.',
  );
if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
  throw new Error('Set a unique BETTER_AUTH_SECRET of at least 32 characters.');
}
const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');
const emailSecurity = emailSecurityConfig();
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins: [new URL(baseURL).origin],
  user: {
    additionalFields: {
      signupKind: { type: 'string', required: false, input: false },
      gender: { type: 'string', required: false, input: false, returned: false },
      studentCode: { type: 'string', required: false, input: false, returned: false },
    },
  },
  logger: {
    level: 'error',
    log: () => {
      reportFailure('identity.auth');
    },
  },
  emailVerification: emailSecurity.enabled
    ? {
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
        expiresIn: 3600,
        sendVerificationEmail: async ({ user, url }) =>
          sendAuthEmail('verify', user.email, url, baseURL),
      }
    : undefined,
  databaseHooks: {
    session: {
      create: {
        before: async (record) => {
          if (!emailSecurity.enabled) return;
          const [person] = await db
            .select()
            .from(schema.user)
            .where(eq(schema.user.id, record.userId))
            .limit(1);
          if (person && needsEmailVerification(person, emailSecurity))
            throw new APIError('FORBIDDEN', {
              code: 'EMAIL_NOT_VERIFIED',
              message: 'يرجى تأكيد البريد الإلكتروني أولًا.',
            });
        },
      },
    },
    user: {
      create: {
        before: async (record, context) => {
          if (context?.path !== '/sign-up/email') return;
          let kind;
          try {
            kind = parseSignupKind(context.body?.accountType);
          } catch {
            throw new APIError('BAD_REQUEST', { message: 'اختر نوع حساب متاحًا.' });
          }
          const gender = parseGender(context.body?.signupGender);
          if ((kind === 'student' && !gender) || (context.body?.signupGender && !gender))
            throw new APIError('BAD_REQUEST', { message: 'اختر النوع: ولد أو بنت.' });
          return {
            data: {
              ...record,
              signupKind: kind,
              gender,
              studentCode: createStudentCode(kind, gender),
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: !emailSecurity.enabled,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 1800,
    sendResetPassword: emailSecurity.enabled
      ? async ({ user, url }) => sendAuthEmail('reset', user.email, url, baseURL)
      : undefined,
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, window: 60, max: 30, storage: 'database' },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && baseURL.startsWith('https://'),
    },
  },
});
