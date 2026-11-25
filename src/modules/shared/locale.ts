export type Locale = 'ar' | 'en';
// Arabic-only release. Ignore legacy English cookies for both public and signed-in pages.
export async function currentLocale(): Promise<Locale> {
  return 'ar';
}
export function translate(_locale: Locale, ar: string, _en: string) {
  return ar;
}
