export const SOCIAL_MEDIA_LIMIT = 3 * 1024 * 1024;
export const socialMediaTypes = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
};
export type SocialContentType = 'text' | 'image' | 'video';
export function validSocialMedia(kind: string, mime: string, size: number) {
  return (
    (kind === 'image' || kind === 'video') &&
    socialMediaTypes[kind].includes(mime) &&
    size > 0 &&
    size <= SOCIAL_MEDIA_LIMIT
  );
}
export function socialMediaSignature(mime: string, b: Uint8Array) {
  const ascii = (start: number, end: number) => String.fromCharCode(...b.slice(start, end));
  if (mime === 'image/png')
    return b.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v);
  if (mime === 'image/jpeg') return b.length >= 4 && b[0] === 255 && b[1] === 216 && b[2] === 255;
  if (mime === 'image/webp') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
  if (mime === 'video/mp4') return b.length >= 16 && ascii(4, 8) === 'ftyp';
  if (mime === 'video/webm') return [26, 69, 223, 163].every((v, i) => b[i] === v) && b.length >= 8;
  return false;
}
