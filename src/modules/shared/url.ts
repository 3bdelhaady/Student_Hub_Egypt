// Shared safety rules for external links stored on course resources and
// submissions. Only https URLs on a real host are accepted; everything else
// (javascript:, data:, protocol-relative, credentials, overlong input) is
// rejected before it reaches the database or the page.
const MAX_URL_LENGTH = 2000;

export function normalizeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value || value.length > MAX_URL_LENGTH) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;
  const host = parsed.hostname;
  if (!host || !host.includes('.') || host.endsWith('.')) return null;
  return parsed.toString();
}

export function externalUrlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
