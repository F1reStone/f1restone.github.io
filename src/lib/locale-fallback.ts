import { isEnabled, swapLocaleInPath, getLocaleFromPath, defaultLocale } from '@/i18n';

export function withLocaleFallback(
  path: string,
  contentLocale: string,
  requestedLocale: string
): string {
  if (!isEnabled() || contentLocale === requestedLocale) return path;
  return swapLocaleInPath(path, requestedLocale);
}

export function getLocaleFallback(
  originPathname: string,
  pathname: string,
  declaredContentLocale?: string
) {
  const requestedLocale = getLocaleFromPath(originPathname);
  const contentLocale = declaredContentLocale ?? getLocaleFromPath(pathname);
  return isEnabled() && requestedLocale !== contentLocale && contentLocale === defaultLocale
    ? { requestedLocale, contentLocale, canonicalPath: swapLocaleInPath(pathname, contentLocale) }
    : undefined;
}
