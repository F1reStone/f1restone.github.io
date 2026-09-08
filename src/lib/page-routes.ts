import { defaultLocale, getLocaleFromPath, getSecondaryLocales, localizedPath } from '@/i18n';

type StaticPath = { params: Record<string, string | number | undefined> };
type PageModule = { getStaticPaths?: () => StaticPath[] | Promise<StaticPath[]> };
// Exclude the fallback dispatcher before Vite builds the import graph, not just
// while iterating: it imports this module and must never import itself back.
const modules = import.meta.glob<PageModule>([
  '/src/pages/**/*.astro',
  '!/src/pages/\\[locale\\]/\\[...path\\].astro',
  '!/src/pages/404.astro',
]);

export function resolvePagePath(pattern: string, params: StaticPath['params']): string {
  const path = pattern.replace(/\[(?:\.\.\.)?(\w+)\]/g, (_, key: string) => {
    if (!(key in params)) throw new Error(`Missing route parameter ${key} in ${pattern}`);
    return String(params[key] ?? '');
  });
  return new URL(path.replace(/\/+$/, '') || '/', 'https://route.invalid').pathname;
}

// Derive coverage from the pages themselves, including their publishing filters.
// New static or content pages automatically participate without a second menu.
export async function getFallbackPages() {
  const locales = getSecondaryLocales();
  if (!locales.length) return [];
  const paths = new Set<string>();
  for (const [file, load] of Object.entries(modules)) {
    const pattern =
      file
        .slice('/src/pages'.length)
        .replace(/\.astro$/, '')
        .replace(/\/index$/, '') || '/';
    if (pattern.includes('[')) {
      const page = await load();
      if (!page.getStaticPaths) throw new Error(`Missing getStaticPaths in ${file}`);
      for (const entry of await page.getStaticPaths())
        paths.add(resolvePagePath(pattern, entry.params));
    } else {
      paths.add(resolvePagePath(pattern, {}));
    }
  }
  return [...paths]
    .filter((path) => getLocaleFromPath(path) === defaultLocale)
    .flatMap((sourcePath) =>
      locales.flatMap((locale) => {
        const path = localizedPath(sourcePath, locale);
        return paths.has(path) ? [] : [{ locale, path, sourcePath }];
      })
    );
}
