import { getFooterNavItems } from '@/config/nav.config';
import { getPublishedPosts, collectTopTags, getTagUrl } from '@/lib/blog';
import { getRoutableProjects, getProjectUrl } from '@/lib/projects';
import { defaultLocale, t } from '@/i18n';
import type { FooterLinkGroup } from '@/components/layout/Footer.astro';

/** Used only when no groups are configured; explicit FireStone groups always win. */
export async function getDerivedFooterGroups(locale: string = defaultLocale): Promise<FooterLinkGroup[]> {
  const [posts, projects] = await Promise.all([getPublishedPosts(locale), getRoutableProjects(locale)]);
  const groups: FooterLinkGroup[] = [
    { title: t('footer.groups.site', locale), links: getFooterNavItems(locale) },
    { title: t('footer.groups.topics', locale), links: collectTopTags(posts, 6).map(tag => ({ label: tag, href: getTagUrl(tag, locale) })) },
    // Placeholder cards have no detail route and must not become dead footer links.
    { title: t('footer.groups.projects', locale), links: projects.slice(0, 5).map(project => ({ label: project.data.title, href: getProjectUrl(project.id, locale) })) },
  ];
  return groups.filter(group => group.links.length > 0);
}
