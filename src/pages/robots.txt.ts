import type { APIContext } from 'astro';
import { absoluteUrl } from '../utils/url';

export function GET(context: APIContext) {
  const sitemap = absoluteUrl(
    '/sitemap-index.xml',
    context.site ?? new URL('https://asuswrt-merlin.github.io'),
  );

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
