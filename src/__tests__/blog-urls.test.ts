import { describe, it, expect, vi } from 'vitest';

// `lib/blog` imports `astro:content` at the top level for its data helpers.
// The URL helpers under test don't touch the content runtime, so a tiny stub
// is enough to let the module load in a plain Node test environment.
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => []),
}));

import {
  getPostSlug,
  getPostUrl,
  getBlogBaseUrl,
  getBlogPageUrl,
  getTagUrl,
  getSecondaryLocales,
} from '@/lib/blog';

// With i18n enabled (zh-CN default, en-US + zh-TW secondary):
// - Default locale stays at site root (no prefix)
// - Secondary locales get a locale prefix
describe('blog URL helpers (i18n enabled)', () => {
  it('strips the locale prefix from a post id to get its slug', () => {
    expect(getPostSlug('zh-CN/hello-world')).toBe('hello-world');
    // Case-insensitive matching
    expect(getPostSlug('zh-cn/hello-world')).toBe('hello-world');
    expect(getPostSlug('en-US/hello-world', 'en-US')).toBe('hello-world');
    // No matching prefix → id returned unchanged.
    expect(getPostSlug('hello-world')).toBe('hello-world');
  });

  it('builds locale-aware post URLs', () => {
    // Default locale: no prefix
    expect(getPostUrl('zh-CN/hello-world')).toBe('/blog/hello-world');
    // Secondary locale: prefixed
    expect(getPostUrl('en-US/hello-world', 'en-US')).toBe('/en-US/blog/hello-world');
  });

  it('builds the blog index base URL, locale-aware', () => {
    // Default locale: no prefix
    expect(getBlogBaseUrl()).toBe('/blog');
    // Secondary locale: prefixed
    expect(getBlogBaseUrl('en-US')).toBe('/en-US/blog');
  });

  it('maps page 1 to the blog root and pages 2+ to /blog/page/N', () => {
    expect(getBlogPageUrl(1)).toBe('/blog');
    expect(getBlogPageUrl(2)).toBe('/blog/page/2');
  });

  it('builds a tag URL from the slugified tag', () => {
    expect(getTagUrl('astro-rocket')).toBe('/blog/tag/astro-rocket');
    expect(getTagUrl('Web Performance')).toBe('/blog/tag/web-performance');
  });

  it('exposes secondary locales when i18n is on', () => {
    expect(getSecondaryLocales()).toEqual(['en-US', 'zh-TW']);
  });
});
