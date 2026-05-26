import { getCollection, render } from 'astro:content';
import { stripLocalePrefix } from '@/lib/blog';

export async function loadLegalPage(locale: string, slug: string) {
  const entries = await getCollection('pages', ({ data }) => {
    return data.locale === locale && (import.meta.env.PROD ? data.draft !== true : true);
  });

  const targetId = `legal/${slug}`;
  const entry = entries.find((item) => stripLocalePrefix(item.id) === targetId);

  if (!entry) {
    throw new Error(`Legal page not found: ${targetId}`);
  }

  const { Content, headings } = await render(entry);

  return {
    entry,
    Content,
    headings,
  };
}