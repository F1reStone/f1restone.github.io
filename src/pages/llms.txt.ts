import type { APIRoute } from 'astro';
import siteConfig from '@/config/site.config';
import { defaultLocale } from '@/i18n';
import { getPublishedPosts, getPostUrl, getRssUrl } from '@/lib/blog';
import { getRoutableProjects, getProjectUrl } from '@/lib/projects';
import { getNavItems } from '@/config/nav.config';



export const GET: APIRoute = async ({ site }) => {
  const base = (site?.toString() || siteConfig.url).replace(/\/$/, '');

  const posts = await getPublishedPosts(defaultLocale);
  const projects = await getRoutableProjects(defaultLocale);

  const line = (title: string, url: string, description?: string) =>
    description ? `- [${title}](${url}): ${description}` : `- [${title}](${url})`;

  const postLines = [...posts]
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf())
    .map((post) => line(post.data.title, `${base}${getPostUrl(post.id, defaultLocale)}`, post.data.description))
    .join('\n');

  const projectLines = [...projects]
    .sort((a, b) => a.data.order - b.data.order)
    .map((project) =>
      line(project.data.title, `${base}${getProjectUrl(project.id, defaultLocale)}`, project.data.description)
    )
    .join('\n');

  const pageLines = getNavItems(defaultLocale)
    .filter((item) => !item.external)
    .map((item) => line(item.label, `${base}${item.href}`));


  const sections = [
    `# ${siteConfig.name}`,
    ``,
    `> ${siteConfig.description}`,
    ``,
    `## Pages`,
    ``,
    ...pageLines,
  ];

  if (projectLines) {
    sections.push(``, `## Projects`, ``, projectLines);
  }

  if (postLines) {
    sections.push(``, `## Blog posts`, ``, postLines);
  }

  sections.push(
    ``,
    `## More`,
    ``,
    line('Sitemap', `${base}/sitemap-index.xml`),
    line('RSS feed', `${base}${getRssUrl(defaultLocale)}`),
    ``,
    `---`,
    ``,
    `Contact: ${siteConfig.email}`,
    ``
  );

  return new Response(sections.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
