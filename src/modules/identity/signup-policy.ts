import { z } from 'zod';
export const signupKind = z.enum(['student', 'student_affairs', 'private_sector']);
export type SignupKind = z.infer<typeof signupKind>;
export function parseSignupKind(value: unknown) {
  return signupKind.parse(value === undefined ? 'student' : value);
}
