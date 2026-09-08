import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site?.toString() || 'https://fire-stone.co/';

  const robotsTxt = `
  User-agent: *
  Allow: /

  # Block API routes
  Disallow: /api/

Sitemap: ${new URL('sitemap-index.xml', siteUrl)}

# Site overview for language models: ${new URL('llms.txt', siteUrl)}
  `.trim();

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
