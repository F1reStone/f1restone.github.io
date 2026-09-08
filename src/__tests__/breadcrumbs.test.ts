import { describe, expect, it, vi } from 'vitest';
vi.mock('@/config/i18n.config', () => ({
  default: { enabled: true, defaultLocale: 'zh-CN', locales: ['zh-CN', 'en-US'] },
}));
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import { getPageAlternates } from '@/lib/page-alternates';
import { withLocaleFallback } from '@/lib/locale-fallback';

describe('page-owned breadcrumbs and language fallbacks', () => {
  it('uses the content title for CJK tags without inventing an intermediate route', () => {
    expect(
      buildBreadcrumbs(
        '人工智能',
        '/blog/tag/%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD/',
        'zh-CN',
        'blog'
      )
    ).toEqual([
      { label: '首页', href: '/' },
      { label: '博客', href: '/blog' },
      { label: '人工智能', href: '/blog/tag/%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD/' },
    ]);
  });
  it('has no breadcrumb on either locale home', () => {
    expect(buildBreadcrumbs('Home', '/en-US/', 'en-US')).toEqual([]);
    expect(buildBreadcrumbs('首页', '/', 'zh-CN')).toEqual([]);
  });
  it('never invents translations for content pages', () => {
    expect(getPageAlternates('/legal/privacy-policy/')).toEqual([
      { locale: 'zh-CN', url: '/legal/privacy-policy/' },
    ]);
    expect(getPageAlternates('/about/').map((alt) => alt.url)).toEqual(['/about']);
    expect(getPageAlternates('/blog/').map((alt) => alt.url)).toEqual(['/blog', '/en-US/blog']);
  });
  it('preserves the real destination and anchors when a language is missing', () => {
    expect(withLocaleFallback('/blog/hello?ref=home#section', 'zh-CN', 'en-US')).toBe(
      '/en-US/blog/hello?ref=home#section'
    );
    expect(withLocaleFallback('/blog/hello', 'zh-CN', 'zh-CN')).toBe('/blog/hello');
  });
});
