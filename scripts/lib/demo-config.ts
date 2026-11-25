export type DemoConfig =
  | { mode: 'disabled' }
  | { mode: 'status' }
  | { mode: 'provision'; passwords: [string, string, string]; rotateLegacy: boolean };
export function readDemoConfig(env: Record<string, string | undefined>): DemoConfig {
  if (env.DEMO_PROVISION_STATUS_ONLY === 'true') return { mode: 'status' };
  if (env.DEMO_PROVISION_PASSWORD !== undefined || env.DEMO_PROVISION_ENABLED !== undefined)
    throw new Error(
      'Legacy shared-password provisioning is withdrawn. Remove both legacy variables.',
    );
  const keys = [
    'DEMO_PROVISION_STUDENT_PASSWORD',
    'DEMO_PROVISION_AGENT_PASSWORD',
    'DEMO_PROVISION_ADMIN_PASSWORD',
  ] as const;
  if (env.DEMO_PROVISION_V2_ENABLED !== 'true') {
    if (
      keys.some((key) => env[key] !== undefined) ||
      env.DEMO_PROVISION_ROTATE_LEGACY !== undefined
    )
      throw new Error('Partial credential configuration.');
    return { mode: 'disabled' };
  }
  if (env.DEMO_MODE !== 'true') throw new Error('Demo mode required.');
  if (env.VERCEL && env.VERCEL_ENV !== 'production')
    throw new Error('Production deployment required.');
  if (!env.VERCEL && env.DEMO_PROVISION_ALLOW_LOCAL !== 'true')
    throw new Error('Disposable local database acknowledgement required.');
  const passwords = keys.map((key) => env[key]);
  if (passwords.some((p) => !p || p.length < 24 || p.length > 128) || new Set(passwords).size !== 3)
    throw new Error('Three distinct fresh 24-128 character credentials required.');
  return {
    mode: 'provision',
    passwords: passwords as [string, string, string],
    rotateLegacy: env.DEMO_PROVISION_ROTATE_LEGACY === 'true',
  };
}
