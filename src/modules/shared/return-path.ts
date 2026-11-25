// Only student-facing destinations are eligible after authentication.
// Never trust an arbitrary callback URL or protocol-relative path.
export function studentReturnPath(value: unknown, fallback = '/account'): string {
  if (
    typeof value !== 'string' ||
    value.length > 1200 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  )
    return fallback;
  try {
    const u = new URL(value, 'https://student.invalid');
    const simple = [
      '/account',
      '/student',
      '/courses',
      '/store',
      '/services',
      '/learning',
      '/requests',
      '/notifications',
      '/profile',
      '/settings',
      '/help',
      '/community',
      '/fitness/connect',
    ];
    if (
      u.origin !== 'https://student.invalid' ||
      (!simple.includes(u.pathname) &&
        !/^\/(courses|store|services|learning|requests|community)\/[A-Za-z0-9_-]{1,150}$/.test(
          u.pathname,
        ))
    )
      return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
export function studentLoginPath(value: unknown) {
  return '/login?next=' + encodeURIComponent(studentReturnPath(value));
}
