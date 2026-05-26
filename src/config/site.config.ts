import { SITE_URL, GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION } from 'astro:env/server';
import i18nConfig, { type I18nConfig } from './i18n.config';

export { i18nConfig };
export type { I18nConfig };

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  author: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  socialLinks: string[];
  twitter?: {
    site: string;
    creator: string;
  };
  verification?: {
    google?: string;
    bing?: string;
  };
  /** Path to author photo (relative to site root, e.g. '/avatar.jpg'). Used in Person schema. */
  authorImage?: string;
  /**
   * Set to false if your blog post images already match your theme color
   * and you don't want the brand color overlay applied on top of them.
   */
  blogImageOverlay?: boolean;
  /**
   * Article features — opt-in modules for blog posts.
   * Each is OFF by default so the theme stays as light as it is today
   * for users who don't enable them.
   */
  articleFeatures?: {
    /** Table of contents shown on blog posts (auto-generated from headings) */
    toc?: {
      /** Master switch — set to true to enable site-wide */
      enabled: boolean;
      /**
       * Where to render the TOC.
       * - 'inline'  → card at the top of every post (default; preserves
       *               full reading width on desktop)
       * - 'sidebar' → sticky sidebar on `xl+` viewports (≥1280px),
       *               hidden on smaller screens
       * - 'auto'    → sidebar on `xl+`, inline card below `xl` so phone
       *               and tablet readers still get the navigation
       */
      layout?: 'inline' | 'sidebar' | 'auto';
      /**
       * Which side the sidebar TOC sits on (only applies when `layout` is
       * 'sidebar' or 'auto'). Defaults to 'right'.
       */
      sidebarPosition?: 'left' | 'right';
      /** Minimum headings before the TOC renders (avoid TOCs on short posts) */
      minHeadings?: number;
      /** Deepest heading level to include (2 = H2 only, 3 = H2+H3, etc.) */
      maxDepth?: 2 | 3 | 4;
    };
    /** Comments at the bottom of blog posts (powered by Giscus) */
    comments?: {
      /** Master switch — set to true to enable site-wide */
      enabled: boolean;
      /** Comments provider. Currently only 'giscus' is supported. */
      provider?: 'giscus';
      /** Giscus configuration. Get values from https://giscus.app */
      giscus?: {
        repo: `${string}/${string}`;
        repoId: string;
        category: string;
        categoryId: string;
        mapping?: 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number';
        strict?: boolean;
        reactionsEnabled?: boolean;
        emitMetadata?: boolean;
        inputPosition?: 'top' | 'bottom';
        theme?: string;
        lang?: string;
      };
    };
  };
  /**
   * Internationalization (i18n) — see `src/config/i18n.config.ts`.
   * Lives in a separate file so the i18n module can be imported by
   * unit tests without pulling in `astro:env/server`.
   */
  i18n?: I18nConfig;
  /**
   * Branding configuration
   * Logo files: Replace SVGs in src/assets/branding/
   * Favicon: Replace in public/favicon.svg
   */
  branding: {
    /** Logo alt text for accessibility */
    logo: {
      alt: string;
      /** Path to logo image for structured data (e.g. '/logo.png'). Add a PNG to public/ and set this. */
      imageUrl?: string;
    };
    /** Favicon path (lives in public/) */
    favicon: {
      svg: string;
    };
    /** Theme colors for manifest and browser UI */
    colors: {
      /** Browser toolbar color (hex) */
      themeColor: string;
      /** PWA splash screen background (hex) */
      backgroundColor: string;
    };
  };
}

const siteConfig: SiteConfig = {
  name: 'FireStone 火石',
  description:
    '兴趣使然的个人开发者 / 设计师 / 内容创作者「FireStone 火石」的个人网站。在这里分享一些我的有趣作品和技术心得。',
  url: SITE_URL || 'https://f1restone.github.io',
  ogImage: '/og-default.svg',
  author: 'FireStone',
  email: 'fstfirestone@gmail.com',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'China',
  },
  socialLinks: [
    'https://github.com/f1restone',
    'https://space.bilibili.com/299649937',
    'https://music.163.com/#/user/home?id=435228979',
    'https://www.youtube.com/@FSFireStone',
    'https://x.com/FSFireStone',
  ],
  twitter: {
    site: 'https://x.com/FSFireStone',
    creator: '@FSFireStone',
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    bing: BING_SITE_VERIFICATION,
  },
  authorImage: '/avatar.svg',
  blogImageOverlay: true,
  articleFeatures: {
    toc: {
      enabled: true,
      layout: 'auto',
      sidebarPosition: 'left',
      minHeadings: 3,
      maxDepth: 3,
    },
    comments: {
      enabled: false,
      provider: 'giscus',
      giscus: {
        repo: 'owner/repo',
        repoId: '',
        category: 'General',
        categoryId: '',
        mapping: 'pathname',
        strict: false,
        reactionsEnabled: true,
        emitMetadata: false,
        inputPosition: 'bottom',
        theme: 'preferred_color_scheme',
        lang: 'en',
      },
    },
  },
  i18n: i18nConfig,
  branding: {
    logo: {
      alt: 'FireStone',
      imageUrl: '/favicon.svg',
    },
    favicon: {
      svg: '/favicon.svg',
    },
    colors: {
      themeColor: '#222526',
      backgroundColor: '#222526',
    },
  },
};

export default siteConfig;
