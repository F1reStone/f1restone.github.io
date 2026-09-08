import { describe, expect, it, vi } from 'vitest';
vi.mock('@/config/i18n.config', () => ({
  default: { enabled: true, defaultLocale: 'en-US', locales: ['en-US', 'zh-CN'] },
}));
import { getLocaleFallback, withLocaleFallback } from '@/lib/locale-fallback';
import { resolvePagePath } from '@/lib/page-routes';

describe('fallbacks use the configured default language', () => {
  it('retains the requested prefix and preserves query strings and fragments', () => {
    expect(withLocaleFallback('/legal/privacy?ref=footer#policy', 'en-US', 'zh-CN')).toBe(
      '/zh-CN/legal/privacy?ref=footer#policy'
    );
    expect(withLocaleFallback('/zh-CN/legal/privacy', 'zh-CN', 'en-US')).toBe('/legal/privacy');
  });
  it('detects default-language rewrites and shared untranslated bodies', () => {
    expect(getLocaleFallback('/zh-CN/legal/privacy/', '/legal/privacy/')).toEqual({
      requestedLocale: 'zh-CN',
      contentLocale: 'en-US',
      canonicalPath: '/legal/privacy/',
    });
    expect(getLocaleFallback('/zh-CN/about/', '/zh-CN/about/', 'en-US')?.contentLocale).toBe(
      'en-US'
    );
    expect(getLocaleFallback('/zh-CN/blog/translated/', '/zh-CN/blog/translated/')).toBeUndefined();
    expect(getLocaleFallback('/missing/', '/404/')).toBeUndefined();
  });
  it('expands existing route parameters including CJK and nested paths', () => {
    expect(resolvePagePath('/blog/tag/[tag]', { tag: '人工智能' })).toBe(
      '/blog/tag/%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD'
    );
    expect(resolvePagePath('/blog/[...slug]', { slug: 'guides/setup' })).toBe('/blog/guides/setup');
    expect(() => resolvePagePath('/blog/[slug]', {})).toThrow('Missing route parameter');
  });
});
