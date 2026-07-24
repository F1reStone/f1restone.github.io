/**
 * Format a date for display
 */
export function formatDate(date: Date, locale = 'zh-CN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

/**
 * Calculate reading time for content. Counts CJK characters (Chinese, Japanese,
 * Korean — space-less languages where each character is a word) at 400 cpm and
 * Latin-script words at 200 wpm, combining both for mixed-language text. Fenced
 * code blocks (```…```) are excluded. Always returns at least 1 minute.
 */
export function getReadingTime(content: string): number {
  // Strip fenced code blocks — code is scanned, not read.
  const withoutCode = content.replace(/```[\s\S]*?```/g, '');

  // Count CJK characters (Unicode range: CJK Unified Ideographs, CJK
  // Extension A, and the common Japanese/Korean Hiragana/Katakana/Hangul
  // blocks). Each character is a "word" in CJK typography.
  const cjkChars = (withoutCode.match(/[一-鿿㐀-䶿぀-ゟ゠-ヿ가-힯]/g) || []).length;

  // Count Latin-script words (whitespace-delimited tokens, minus any that are
  // pure punctuation).
  const latinWords = withoutCode
    .replace(/[一-鿿㐀-䶿぀-ゟ゠-ヿ가-힯]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;

  const cpm = 400; // CJK chars per minute
  const wpm = 200; // Latin words per minute
  return Math.max(1, Math.ceil(cjkChars / cpm + latinWords / wpm));
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if a URL is external
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Resolve a flat array of social profile URLs into structured link objects.
 * Matches each URL against known platforms to derive icon name and label.
 */
const SOCIAL_PLATFORMS = [
  { key: 'github',    match: /github\.com/i,                  label: 'GitHub',      icon: 'github'    },
  { key: 'x-twitter',   match: /x\.com|twitter\.com/i,          label: 'X', icon: 'x-twitter' },
  { key: 'bilibili',  match: /bilibili\.com/i,                label: '哔哩哔哩',    icon: 'bilibili'  },
  { key: 'zhihu',     match: /zhihu\.com/i,                   label: '知乎',        icon: 'zhihu'     },
  { key: 'neteasecloudmusic', match: /music\.163\.com/i,      label: '网易云音乐',    icon: 'neteasecloudmusic' },
  { key: 'weibo',     match: /weibo\.com/i,                   label: '微博',        icon: 'weibo'     },
  { key: 'youtube',   match: /youtube\.com/i,                 label: 'YouTube',     icon: 'youtube'   },
] as const;

export interface ResolvedSocialLink {
  key: string;
  href: string;
  label: string;
  icon: string;
}

export function resolveSocialLinks(urls: string[]): ResolvedSocialLink[] {
  // FireStone: [Optimized to map all URLs. Returns a fallback icon for unknown platforms]
  return urls.map((href) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.match.test(href));
    if (platform) {
      return { key: platform.key, href, label: platform.label, icon: platform.icon };
    }
    // Fallback for unknown links
    return { key: 'link', href, label: 'Social', icon: 'link' };
  });
}
