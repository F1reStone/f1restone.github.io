import { getLocaleFromPath, getLocales, localizedPath, stripLocaleFromPath } from '@/i18n';

// These shared views have a route for every enabled locale. Content routes
// supply their own verified translations; other pages keep only themselves.
const sharedPages = new Set(['/', '/about', '/ai', '/blog', '/projects']);

export function getPageAlternates(pathname: string): { locale: string; url: string }[] {
  const base = stripLocaleFromPath(pathname).replace(/\/$/, '') || '/';
  return sharedPages.has(base)
    ? getLocales().map((locale) => ({ locale, url: localizedPath(base, locale) }))
    : [{ locale: getLocaleFromPath(pathname), url: pathname }];
}
