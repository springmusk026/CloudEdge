// Public Routes — SSR, feeds, sitemap
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { createDb } from '@cloudedge/db';
import { posts, tags, postTags, users, redirects, settings } from '@cloudedge/db';
import { eq, desc, and } from 'drizzle-orm';

export const publicRoutes = new Hono<AppEnv>();

// Ensure db is available on non-/api routes
publicRoutes.use('*', async (c, next) => {
  if (!c.get('db')) c.set('db', createDb(c.env.DB));
  await next();
});

// Handle redirects
publicRoutes.use('*', async (c, next) => {
  const db = c.get('db');
  const path = new URL(c.req.url).pathname;
  const redirect = await db.select().from(redirects).where(eq(redirects.sourcePath, path)).get();
  if (redirect) return c.redirect(redirect.destinationUrl, redirect.statusCode as 301 | 302);
  await next();
});

// GET /rss.xml
publicRoutes.get('/rss.xml', async (c) => {
  const cached = await c.env.CACHE_RENDERED.get('rss');
  if (cached) { c.header('Content-Type', 'application/xml'); return c.body(cached); }

  const db = c.get('db');
  const recentPosts = await db.select().from(posts).where(eq(posts.status, 'published')).orderBy(desc(posts.publishedAt)).limit(20).all();
  const siteUrl = c.env.SITE_URL;

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>CloudEdge Blog</title>
  <link>${siteUrl}</link>
  <description>A modern blog powered by Cloudflare edge infrastructure</description>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
  ${recentPosts.map(p => `<item>
    <title>${escXml(p.title)}</title>
    <link>${siteUrl}/${p.slug}</link>
    <guid>${siteUrl}/${p.slug}</guid>
    <pubDate>${new Date(p.publishedAt!).toUTCString()}</pubDate>
    <description>${escXml(p.excerpt || '')}</description>
  </item>`).join('\n  ')}
</channel>
</rss>`;

  await c.env.CACHE_RENDERED.put('rss', rss, { expirationTtl: 3600 });
  c.header('Content-Type', 'application/xml');
  return c.body(rss);
});

// GET /sitemap.xml
publicRoutes.get('/sitemap.xml', async (c) => {
  const cached = await c.env.CACHE_RENDERED.get('sitemap');
  if (cached) { c.header('Content-Type', 'application/xml'); return c.body(cached); }

  const db = c.get('db');
  const allPosts = await db.select({ slug: posts.slug, updatedAt: posts.updatedAt }).from(posts).where(eq(posts.status, 'published')).all();
  const allTags = await db.select({ slug: tags.slug }).from(tags).all();
  const siteUrl = c.env.SITE_URL;

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  ${allPosts.map(p => `<url><loc>${siteUrl}/${p.slug}</loc><lastmod>${p.updatedAt}</lastmod><priority>0.8</priority></url>`).join('\n  ')}
  ${allTags.map(t => `<url><loc>${siteUrl}/tag/${t.slug}</loc><priority>0.6</priority></url>`).join('\n  ')}
</urlset>`;

  await c.env.CACHE_RENDERED.put('sitemap', sitemap, { expirationTtl: 3600 });
  c.header('Content-Type', 'application/xml');
  return c.body(sitemap);
});

// GET /feed.json — JSON Feed 1.1
publicRoutes.get('/feed.json', async (c) => {
  const db = c.get('db');
  const recentPosts = await db.select().from(posts).where(eq(posts.status, 'published')).orderBy(desc(posts.publishedAt)).limit(20).all();
  const siteUrl = c.env.SITE_URL;

  return c.json({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'CloudEdge Blog',
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    items: recentPosts.map(p => ({
      id: `${siteUrl}/${p.slug}`,
      url: `${siteUrl}/${p.slug}`,
      title: p.title,
      content_html: p.contentHtml,
      summary: p.excerpt,
      date_published: p.publishedAt,
    })),
  });
});

// GET /robots.txt
publicRoutes.get('/robots.txt', (c) => {
  c.header('Content-Type', 'text/plain');
  return c.body(`User-agent: *\nAllow: /\nSitemap: ${c.env.SITE_URL}/sitemap.xml`);
});

function escXml(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
