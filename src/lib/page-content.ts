import { getPublishedPosts } from '@/lib/blog';
import { getVisibleProjects } from '@/lib/projects';
import { defaultLocale } from '@/i18n';

export async function getFeaturedContent(locale: string = defaultLocale) {
  const [posts, projects] = await Promise.all([
    getPublishedPosts(locale),
    getVisibleProjects(locale),
  ]);
  return {
    posts:
      posts.length || locale === defaultLocale ? posts : await getPublishedPosts(defaultLocale),
    projects:
      projects.length || locale === defaultLocale
        ? projects
        : await getVisibleProjects(defaultLocale),
  };
}
