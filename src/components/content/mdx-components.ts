import PostLink from '@/components/blog/PostLink.astro';
import YouTube from '@/components/patterns/YouTube.astro';

/** Shared collection rendering contract: all MDX surfaces expose the same helpers. */
export const mdxComponents = { PostLink, YouTube };
