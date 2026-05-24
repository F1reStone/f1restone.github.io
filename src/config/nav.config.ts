/**
 * Navigation Configuration
 *
 * Defines navigation menus for the site. Astro handles routing via the
 * filesystem — this only controls which links appear in nav menus.
 *
 * - `navItems`       → main (header) navigation
 * - `footerNavItems` → footer navigation, configured independently from
 *                      the header so you can show different links in the
 *                      footer (e.g. add a Privacy link, drop About, etc.)
 * - `legalLinks`     → small legal-style links (Privacy, Terms, Imprint…)
 *                      shown in the footer's bottom row when supported
 *                      by the active footer layout.
 */

export interface NavItem {
  label: string;
  href: string;
  order: number;
  external?: boolean;
}

export interface LegalLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: NavItem[];
}
// FireStone: [Added FooterLinkGroup interface and footerLinkGroups array to manage column-based footer globally]

export const navItems: NavItem[] = [
  { label: '项目', href: '/projects', order: 1 },
  { label: '博客', href: '/blog', order: 2 },
  { label: 'FireStone AI', href: '/ai', order: 3 },
  { label: '关于', href: '/about', order: 4 },
];

export const footerNavItems: NavItem[] = [
  { label: '项目', href: '/projects', order: 1 },
  { label: '博客', href: '/blog', order: 2 },
  { label: 'FireStone AI', href: '/ai', order: 3 },
  { label: '关于', href: '/about', order: 4 },
];

export const legalLinks: LegalLink[] = [
  { label: 'ICP 备案测试', href: 'https://beian.miit.gov.cn/' },
];

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: '探索',
    links: [
      { label: '项目', href: '/projects', order: 1 },
      { label: '博客', href: '/blog', order: 2 },
      { label: 'FireStone AI', href: '/ai', order: 3 },
    ],
  },
  {
    title: '项目',
    links: [
      { label: 'FireStone 网站', href: '/projects/firestone-website', order: 1 },
      { label: 'SparkForge', href: '/projects/sparkforge', order: 2 },
    ],
  },
  {
    title: '技术支持',
    links: [
      { label: 'Astro', href: 'https://astro.build/', order: 1 },
      { label: 'Astro Rocket', href: 'https://astrorocket.dev/', order: 2 },
      { label: 'Cloudflare', href: 'https://cloudflare.com/', order: 3 },
      { label: 'GitHub Pages', href: 'https://docs.github.com/pages/', order: 4 },
      { label: 'React', href: 'https://react.dev/', order: 5 },
      { label: 'Simple Icons', href: 'https://simpleicons.org/', order: 6 },
    ],
  },
  {
    title: '关于',
    links: [
      { label: '关于 FireStone', href: '/about', order: 1 },
      { label: '负责任 AI 声明', href: '/ai/responsible-ai', order: 2 },
      { label: '反馈网站 Bug', href: 'https://github.com/F1reStone/f1restone.github.io/issues', order: 3 },
    ],
  },
];

/**
 * Get header navigation items sorted by order
 */
export function getNavItems(): NavItem[] {
  return [...navItems].sort((a, b) => a.order - b.order);
}

/**
 * Get footer navigation items sorted by order.
 * Configured independently from the header — edit `footerNavItems`
 * above to add/remove links in the footer only.
 */
export function getFooterNavItems(): NavItem[] {
  return [...footerNavItems].sort((a, b) => a.order - b.order);
}

/**
 * Get configured legal links (Privacy, Terms, etc.).
 * Returned as-is — order matches declaration order.
 */
export function getLegalLinks(): LegalLink[] {
  return [...legalLinks];
}

/**
 * Get configured footer link groups for the columns layout.
 */
export function getFooterLinkGroups(): FooterLinkGroup[] {
  return [...footerLinkGroups];
}