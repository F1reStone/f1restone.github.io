import type { APIRoute, GetStaticPaths } from 'astro';
import { collectTags, getPublishedPosts, tagToSlug } from '@/lib/blog';
import { renderOgSvg } from '@/lib/og';

function safeTagSlug(tag: string): string {
  const slug = tagToSlug(tag);
  return slug.trim();
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPublishedPosts();
  const tags = collectTags(posts);

  return tags.flatMap((tag) => {
    const slug = safeTagSlug(tag);
    if (!slug) return [];

    const count = posts.filter((p) => p.data.tags.includes(tag)).length;

    return [
      {
        params: { tag: slug },
        props: { tag, count },
      },
    ];
  });
};

export const GET: APIRoute = ({ props }) => {
  const tag = props.tag as string;
  const count = props.count as number;

  const svg = renderOgSvg({
    title: `#${tag}`,
    subtitle: `${count} post${count === 1 ? '' : 's'} on the blog`,
    kind: 'TAG',
  });

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
