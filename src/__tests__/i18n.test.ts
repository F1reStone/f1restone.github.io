import { describe, it, expect } from 'vitest';
import {
  t,
  localizedPath,
  resolveLocale,
  isValidLocale,
  getLocaleName,
  getLocaleFromPath,
  stripLocaleFromPath,
  swapLocaleInPath,
} from '../i18n';

describe('i18n t() helper', () => {
  it('returns a translation for a valid dotted key', () => {
    expect(t('common.readMore', 'zh-CN')).toBe('阅读更多');
  });

  it('falls back to the default-locale string when the locale has no entry', () => {
    // 'ja' has no dictionary loaded — should fall back to zh-CN
    expect(t('common.readMore', 'ja')).toBe('阅读更多');
  });

  it('returns the key itself when no translation exists in any dictionary', () => {
    expect(t('some.missing.key', 'zh-CN')).toBe('some.missing.key');
  });

  it('interpolates {placeholder} variables', () => {
    expect(t('blog.readingTime', 'zh-CN', { minutes: 5 })).toBe('预计阅读时间 5 分钟');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(t('blog.readingTime', 'zh-CN', {})).toBe('预计阅读时间 {minutes} 分钟');
  });
});

describe('i18n localizedPath()', () => {
  it('returns the path unchanged when i18n is disabled', () => {
    // With default config (enabled: false), i18n is effectively off
    expect(localizedPath('/about')).toBe('/about');
    expect(localizedPath('/')).toBe('/');
    expect(localizedPath('blog/hello')).toBe('/blog/hello');
  });
});

describe('i18n locale helpers', () => {
  it('resolves an unknown locale to the default', () => {
    expect(resolveLocale('xx')).toBe('zh-CN');
    expect(resolveLocale(undefined)).toBe('zh-CN');
  });

  it('validates a configured locale', () => {
    expect(isValidLocale('zh-CN')).toBe(true);
    expect(isValidLocale('xx')).toBe(false);
    expect(isValidLocale(undefined)).toBe(false);
  });

  it('returns the display name when configured, otherwise the code', () => {
    expect(getLocaleName('zh-CN')).toBe('简体中文');
    expect(getLocaleName('en-US')).toBe('English');
    expect(getLocaleName('xx')).toBe('xx');
  });
});

describe('i18n getLocaleFromPath()', () => {
  it('returns the default locale for the root path', () => {
    expect(getLocaleFromPath('/')).toBe('zh-CN');
  });

  it('returns the default locale when no recognized prefix is present', () => {
    expect(getLocaleFromPath('/about')).toBe('zh-CN');
    expect(getLocaleFromPath('/blog/hello-world')).toBe('zh-CN');
  });

  it('returns the default locale when i18n is disabled regardless of path', () => {
    // With i18n disabled, all paths resolve to the default locale
    expect(getLocaleFromPath('/about')).toBe('zh-CN');
  });

  it('normalizes paths without a leading slash', () => {
    expect(getLocaleFromPath('about')).toBe('zh-CN');
  });
});

describe('i18n stripLocaleFromPath()', () => {
  it('leaves a path unchanged when the first segment is not a configured locale', () => {
    expect(stripLocaleFromPath('/about')).toBe('/about');
  });

  it('returns "/" for the root path', () => {
    expect(stripLocaleFromPath('/')).toBe('/');
  });
});

describe('i18n swapLocaleInPath()', () => {
  it('swaps the locale in a path', () => {
    // Default locale (zh-CN): no prefix
    expect(swapLocaleInPath('/about', 'zh-CN')).toBe('/about');
    expect(swapLocaleInPath('/en-US/about', 'zh-CN')).toBe('/about');
    // Secondary locale (en-US): prefixed
    expect(swapLocaleInPath('/about', 'en-US')).toBe('/en-US/about');
    expect(swapLocaleInPath('/en-US/about', 'en-US')).toBe('/en-US/about');
  });
});
