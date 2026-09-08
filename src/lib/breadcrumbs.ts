import { defaultLocale, localizedPath, stripLocaleFromPath, t } from '@/i18n';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Build content hierarchy from page data, never from menu entries or URL slugs. */
export function buildBreadcrumbs(
  label: string | undefined,
  pathname: string,
  locale: string = defaultLocale,
  section?: 'blog' | 'projects' | 'legal'
): BreadcrumbItem[] {
  if (!label || stripLocaleFromPath(pathname).replace(/\/$/, '') === '') return [];
  const items: BreadcrumbItem[] = [
    { label: t('common.home', locale), href: localizedPath('/', locale) },
  ];
  if (section)
    items.push({
      label: t(`${section}.title`, locale),
      href: localizedPath(`/${section}`, locale),
    });
  items.push({ label, href: pathname });
  return items;
}
