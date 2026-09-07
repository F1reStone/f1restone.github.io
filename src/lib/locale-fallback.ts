import { isEnabled } from '@/i18n';

export function withLocaleFallback(
  path: string,
  contentLocale: string,
  requestedLocale: string
): string {
  if (!isEnabled() || contentLocale === requestedLocale) return path;
  const url = new URL(path, 'https://local.invalid');
  url.searchParams.set('requestedLocale', requestedLocale);
  return `${url.pathname}${url.search}${url.hash}`;
}
