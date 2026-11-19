import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';
import { withBase } from '../utils/url';

export async function GET(context: APIContext) {
  const posts = (await getCollection('guides')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: `${site.name} — Guides`,
    description: site.description,
    site: new URL(import.meta.env.BASE_URL, context.site ?? site.url),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: withBase(`/guides/${post.id}/`),
    })),
  });
}
