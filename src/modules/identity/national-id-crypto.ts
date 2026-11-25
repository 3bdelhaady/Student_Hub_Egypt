import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
function key(secret: string) {
  if (secret.length < 32) throw new Error('National ID encryption is not configured');
  return scryptSync(secret, 'student-hub:national-id:encryption:v1', 32);
}
export function encryptNationalId(value: string, secret: string): string {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [
    'v1',
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    encrypted.toString('base64'),
  ].join('.');
}
export function decryptNationalId(value: string, secret: string): string {
  const [version, iv, tag, data] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('Invalid encrypted identity');
  const cipher = createDecipheriv('aes-256-gcm', key(secret), Buffer.from(iv, 'base64'));
  cipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([cipher.update(Buffer.from(data, 'base64')), cipher.final()]).toString(
    'utf8',
  );
}
export function mayReadNationalId(
  viewer: { user: { id: string }; platformAdmin: boolean },
  ownerId: string,
) {
  return viewer.user.id === ownerId || viewer.platformAdmin;
}
