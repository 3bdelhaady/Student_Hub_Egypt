import { randomBytes } from 'node:crypto';
export type Gender = 'male' | 'female';
export function parseGender(value: unknown): Gender | null {
  return value === 'male' || value === 'female' ? value : null;
}
export function createStudentCode(kind: string, gender: Gender | null) {
  const prefix: Record<string, string> = {
    student: 'ST',
    student_affairs: 'SA',
    private_sector: 'PS',
    admin: 'AD',
  };
  if (!prefix[kind]) throw new Error('Unknown account type');
  return (
    prefix[kind] +
    (gender === 'male' ? 'M' : gender === 'female' ? 'F' : 'X') +
    randomBytes(8).toString('hex').toUpperCase()
  );
}
