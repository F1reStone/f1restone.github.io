import { getCollection, type CollectionEntry } from 'astro:content';
import { stripLocalePrefix } from '@/lib/blog';

export type LegalPageEntry = CollectionEntry<'pages'>;

export interface LegalPageSummary {
  title: string;
  titleEn?: string;
  description: string;
  updatedAt?: Date;
  href: string;
  slug: string;
}

function isLegalEntry(entry: LegalPageEntry) {
  return stripLocalePrefix(entry.id).startsWith('legal/');
}

export async function getLegalEntries(locale = 'zh-CN'): Promise<LegalPageEntry[]> {
  const entries = await getCollection('pages', ({ data }) => {
    return data.locale === locale && (import.meta.env.PROD ? data.draft !== true : true);
  });

  return entries.filter(isLegalEntry);
}

export async function getLegalPages(locale = 'zh-CN'): Promise<LegalPageSummary[]> {
  const entries = await getLegalEntries(locale);

  return entries
    .sort((a, b) => {
      const delta = (b.data.updatedAt?.valueOf() ?? 0) - (a.data.updatedAt?.valueOf() ?? 0);
      return delta !== 0 ? delta : a.data.title.localeCompare(b.data.title);
    })
    .map((entry) => {
      const id = stripLocalePrefix(entry.id); // zh-CN/legal/privacy-policy -> legal/privacy-policy
      const slug = id.replace(/^legal\//, '');

      return {
        title: entry.data.title,
        titleEn: entry.data.titleEn,
        description: entry.data.description,
        updatedAt: entry.data.updatedAt,
        href: `/legal/${slug}`,
        slug,
      };
    });
}

export async function getLegalPageBySlug(locale: string, slug: string): Promise<LegalPageEntry> {
  const entries = await getLegalEntries(locale);
  const entry = entries.find((item) => stripLocalePrefix(item.id) === `legal/${slug}`);

  if (!entry) {
    throw new Error(`Legal page not found: legal/${slug}`);
  }

  return entry;
}