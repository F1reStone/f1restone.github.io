import { describe, it, expect, vi } from 'vitest';

// Exercise the nav config's locale resolution with i18n turned ON and two
// locales. The default locale stays at the site root; the secondary locale is
// prefixed and labels are translated via the dictionary. Guards the localized
// header/footer nav and logo wired up for #438.
vi.mock('@/config/i18n.config', () => ({
  default: {
    enabled: true,
    defaultLocale: 'zh-CN',
    locales: ['zh-CN', 'en-US'],
    localeNames: { 'zh-CN': '简体中文', 'en-US': 'English' },
    detectBrowserLocale: false,
  },
}));

import { getNavItems, getLogoHref, resolveNavItem, type NavItem } from '@/config/nav.config';

describe('nav config — locale resolution (zh-CN default, en-US secondary)', () => {
  it('keeps default-locale hrefs at the site root', () => {
    const items = getNavItems('zh-CN');
    expect(items.find((i) => i.label === '博客')?.href).toBe('/blog/');
    expect(items.find((i) => i.label === '关于')?.href).toBe('/about/');
  });

  it('prefixes secondary-locale hrefs with the locale', () => {
    const items = getNavItems('en-US');
    // Should include locale-prefixed paths for our nav items
    const hrefs = items.map((i) => i.href);
    expect(hrefs.some((h) => h.startsWith('/en-US/'))).toBe(true);
  });

  it('translates labels via the dictionary (labelKey)', () => {
    const en = getNavItems('en-US');
    // en-US.json has nav.items keys with English labels
    expect(en.some((i) => i.href === '/en-US/blog/' && i.label === 'Blog')).toBe(true);
    expect(en.some((i) => i.href === '/en-US/about/' && i.label === 'About')).toBe(true);
  });

  it('points the logo at the locale home', () => {
    expect(getLogoHref('zh-CN')).toBe('/');
    expect(getLogoHref('en-US')).toBe('/en-US');
  });

  it('never locale-prefixes external, mailto/tel, or anchor hrefs', () => {
    expect(
      resolveNavItem(
        { label: 'GitHub', href: 'https://github.com/x', order: 1, external: true },
        'en-US'
      ).href
    ).toBe('https://github.com/x');
    expect(resolveNavItem({ label: 'Top', href: '#top', order: 1 }, 'en-US').href).toBe('#top');
    expect(resolveNavItem({ label: 'Mail', href: 'mailto:a@b.com', order: 1 }, 'en-US').href).toBe(
      'mailto:a@b.com'
    );
  });

  it('applies a per-locale override (label + path), still locale-prefixed', () => {
    const item: NavItem = {
      label: '联系我们',
      href: '/contact',
      order: 1,
      locales: { 'en-US': { label: 'Contact Us', href: '/contact-us' } },
    };
    expect(resolveNavItem(item, 'en-US')).toEqual({
      label: 'Contact Us',
      href: '/en-US/contact-us',
      external: undefined,
    });
    // The default locale is unaffected by an en-US-only override.
    expect(resolveNavItem(item, 'zh-CN')).toEqual({
      label: '联系我们',
      href: '/contact',
      external: undefined,
    });
  });

  it('falls back to the literal label when no labelKey is set', () => {
    expect(resolveNavItem({ label: 'Docs', href: '/docs', order: 1 }, 'en-US').label).toBe('Docs');
  });
});
