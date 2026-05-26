import { getCollection, render } from 'astro:content';
import { stripLocalePrefix } from '@/lib/blog';

export interface LegalPageSummary {
  title: string;
  titleEn?: string;
  description: string;
  updatedAt?: Date;
  href: string;
  slug: string;
}

function isLegalEntryId(id: string) {
  return stripLocalePrefix(id).startsWith('legal/');
}

export async function getLegalPages(locale = 'zh-CN'): Promise<LegalPageSummary[]> {
  const entries = await getCollection('pages', ({ data }) => {
    return data.locale === locale && (import.meta.env.PROD ? data.draft !== true : true);
  });

  return entries
    .filter((entry) => isLegalEntryId(entry.id))
    .sort((a, b) => {
      const delta = (b.data.updatedAt?.valueOf() ?? 0) - (a.data.updatedAt?.valueOf() ?? 0);
      return delta !== 0 ? delta : a.data.title.localeCompare(b.data.title);
    })
    .map((entry) => {
      const id = stripLocalePrefix(entry.id); // e.g. zh-CN/legal/privacy-policy -> legal/privacy-policy
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

export async function loadLegalPage(locale: string, slug: string) {
  const entries = await getCollection('pages', ({ data }) => {
    return data.locale === locale && (import.meta.env.PROD ? data.draft !== true : true);
  });

  const entry = entries.find((item) => stripLocalePrefix(item.id) === `legal/${slug}`);

  if (!entry) {
    throw new Error(`Legal page not found: legal/${slug}`);
  }

  const { Content, headings } = await render(entry);

  return {
    entry,
    Content,
    headings,
  };
}