// Email flows are implemented but activation requires verified delivery setup.
export const securityReadiness = Object.freeze({
  emailVerificationEnabled: false,
  passwordRecoveryEnabled: false,
  privilegedMfaEnabled: false,
  requiredSetup: [
    'verified-sender-domain',
    'transactional-email-provider',
    'delivery-monitoring',
    'recovery-pages',
    'privileged-mfa-enrollment',
    'recovery-drill',
  ] as const,
});
