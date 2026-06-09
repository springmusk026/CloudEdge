// Posts CRUD Routes — Full content management API
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { posts, postTags, tags, postRevisions, users } from '@cloudedge/db';
import { eq, desc, and, sql, like, inArray } from 'drizzle-orm';
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth';

export const postsRoutes = new Hono<AppEnv>();

// GET /api/v1/posts — list posts (public: published only, admin: all)
postsRoutes.get('/', optionalAuth, async (c) => {
  const db = c.get('db');
  const role = c.get('userRole');
  const page = Number(c.req.query('page') || '1');
  const limit = Math.min(Number(c.req.query('limit') || '10'), 50);
  const offset = (page - 1) * limit;
  const status = c.req.query('status');
  const tag = c.req.query('tag');
  const featured = c.req.query('featured');

  const isAdmin = role && ['owner', 'admin', 'editor'].includes(role);

  let query = db.select({
    id: posts.id, title: posts.title, slug: posts.slug, excerpt: posts.excerpt,
    status: posts.status, authorId: posts.authorId, featured: posts.featured,
    readingTimeMinutes: posts.readingTimeMinutes, visibility: posts.visibility,
    publishedAt: posts.publishedAt, createdAt: posts.createdAt,
    primaryImageR2Key: posts.primaryImageR2Key,
  }).from(posts).$dynamic();

  if (!isAdmin) {
    query = query.where(eq(posts.status, 'published'));
  } else if (status) {
    query = query.where(eq(posts.status, status as any));
  }

  if (featured === 'true') query = query.where(eq(posts.featured, true));

  const results = await query.orderBy(desc(posts.publishedAt)).limit(limit).offset(offset).all();

  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(posts)
    .where(isAdmin ? undefined : eq(posts.status, 'published')).get();

  return c.json({ posts: results, pagination: { page, limit, total: countResult?.count || 0 } });
});

// GET /api/v1/posts/:idOrSlug
postsRoutes.get('/:idOrSlug', optionalAuth, async (c) => {
  const db = c.get('db');
  const param = c.req.param('idOrSlug');
  const role = c.get('userRole');

  // Try by ID first (UUID format), then by slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
  const post = await db.select().from(posts).where(isUuid ? eq(posts.id, param) : eq(posts.slug, param)).get();
  if (!post) return c.json({ error: 'Post not found' }, 404);

  // Check access
  const isAdmin = role && ['owner', 'admin', 'editor', 'author'].includes(role);
  if (!isAdmin && post.status !== 'published') return c.json({ error: 'Not found' }, 404);

  // Get tags
  const postTagRows = await db.select({ name: tags.name, slug: tags.slug })
    .from(postTags).innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id)).all();

  // Get author
  const author = await db.select({ id: users.id, name: users.name, bio: users.bio, avatarR2Key: users.avatarR2Key })
    .from(users).where(eq(users.id, post.authorId)).get();

  // Track view via Analytics DO
  const analyticsId = c.env.ANALYTICS.idFromName('global');
  const analyticsStub = c.env.ANALYTICS.get(analyticsId);
  c.executionCtx.waitUntil(analyticsStub.fetch(new Request('http://internal/track', {
    method: 'POST', body: JSON.stringify({ postId: post.id, ip: c.req.header('CF-Connecting-IP') })
  })));

  return c.json({ ...post, tags: postTagRows, author });
});

// POST /api/v1/posts — create
postsRoutes.post('/', authMiddleware, requireRole('owner', 'admin', 'editor', 'author'), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId')!;
  const body = await c.req.json<{ title: string; slug?: string; contentMarkdown?: string; contentHtml?: string; excerpt?: string; status?: string; tags?: string[]; visibility?: string; featured?: boolean; metaTitle?: string; metaDescription?: string }>();

  let slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Slug collision detection — auto-increment
  let existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).get();
  let suffix = 2;
  while (existing) {
    slug = `${slug.replace(/-\d+$/, '')}-${suffix}`;
    existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).get();
    suffix++;
  }
  const wordCount = (body.contentMarkdown || '').split(/\s+/).length;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 250));

  const id = crypto.randomUUID();
  const publishedAt = body.status === 'published' ? new Date().toISOString() : null;

  await db.insert(posts).values({
    id, title: body.title, slug, contentMarkdown: body.contentMarkdown,
    contentHtml: body.contentHtml, excerpt: body.excerpt,
    status: (body.status as any) || 'draft', authorId: userId,
    wordCount, readingTimeMinutes, visibility: (body.visibility as any) || 'public',
    featured: body.featured || false, publishedAt,
    metaTitle: body.metaTitle, metaDescription: body.metaDescription,
  });

  // Handle tags
  if (body.tags?.length) {
    const tagRows = await db.select().from(tags).where(inArray(tags.slug, body.tags)).all();
    if (tagRows.length) {
      await db.insert(postTags).values(tagRows.map(t => ({ postId: id, tagId: t.id })));
    }
  }

  // Invalidate cache
  c.executionCtx.waitUntil(c.env.CACHE_RENDERED.delete(`post:${slug}`));
  c.executionCtx.waitUntil(c.env.CACHE_RENDERED.delete('homepage'));

  return c.json({ id, slug }, 201);
});

// PUT /api/v1/posts/:id — update
postsRoutes.put('/:id', authMiddleware, requireRole('owner', 'admin', 'editor', 'author'), async (c) => {
  const db = c.get('db');
  const postId = c.req.param('id');
  const body = await c.req.json<Partial<{ title: string; slug: string; contentMarkdown: string; contentHtml: string; excerpt: string; status: string; tags: string[]; visibility: string; featured: boolean; metaTitle: string; metaDescription: string }>>();

  const existing = await db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!existing) return c.json({ error: 'Post not found' }, 404);

  // Save revision
  await db.insert(postRevisions).values({
    id: crypto.randomUUID(), postId, contentHtml: existing.contentHtml,
    contentMarkdown: existing.contentMarkdown, changedBy: c.get('userId'),
  });

  const wordCount = body.contentMarkdown ? body.contentMarkdown.split(/\s+/).length : undefined;
  const publishedAt = body.status === 'published' && existing.status !== 'published' ? new Date().toISOString() : undefined;

  await db.update(posts).set({
    ...body.title && { title: body.title },
    ...body.slug && { slug: body.slug },
    ...body.contentMarkdown && { contentMarkdown: body.contentMarkdown },
    ...body.contentHtml && { contentHtml: body.contentHtml },
    ...body.excerpt && { excerpt: body.excerpt },
    ...body.status && { status: body.status as any },
    ...body.visibility && { visibility: body.visibility as any },
    ...body.featured !== undefined && { featured: body.featured },
    ...body.metaTitle && { metaTitle: body.metaTitle },
    ...body.metaDescription && { metaDescription: body.metaDescription },
    ...wordCount && { wordCount, readingTimeMinutes: Math.max(1, Math.round(wordCount / 250)) },
    ...publishedAt && { publishedAt },
    updatedAt: new Date().toISOString(),
    revisionCount: (existing.revisionCount || 0) + 1,
  }).where(eq(posts.id, postId));

  // Invalidate cache
  c.executionCtx.waitUntil(c.env.CACHE_RENDERED.delete(`post:${existing.slug}`));
  if (body.slug) c.executionCtx.waitUntil(c.env.CACHE_RENDERED.delete(`post:${body.slug}`));
  c.executionCtx.waitUntil(c.env.CACHE_RENDERED.delete('homepage'));

  // If published, generate embedding for Vectorize
  if (body.status === 'published' || existing.status === 'published') {
    c.executionCtx.waitUntil(generateEmbedding(c, postId, body.title || existing.title, body.contentMarkdown || existing.contentMarkdown || ''));
  }

  return c.json({ ok: true });
});

// DELETE /api/v1/posts/:id
postsRoutes.delete('/:id', authMiddleware, requireRole('owner', 'admin'), async (c) => {
  const db = c.get('db');
  const postId = c.req.param('id');
  const existing = await db.select({ slug: posts.slug }).from(posts).where(eq(posts.id, postId)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  await db.delete(posts).where(eq(posts.id, postId));
  c.executionCtx.waitUntil(c.env.CACHE_RENDERED.delete(`post:${existing.slug}`));
  c.executionCtx.waitUntil(c.env.CACHE_RENDERED.delete('homepage'));

  return c.json({ ok: true });
});

// Helper: generate embedding and upsert to Vectorize
async function generateEmbedding(c: any, postId: string, title: string, content: string) {
  try {
    const text = `${title}\n\n${content.slice(0, 2000)}`;
    const { data } = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] });
    if (data?.[0]) {
      await c.env.VECTORIZE.upsert([{ id: postId, values: data[0], metadata: { title } }]);
    }
  } catch (e) { console.error('Embedding generation failed:', e); }
}



// POST /api/v1/posts/:id/duplicate — clone a post as draft
postsRoutes.post('/:id/duplicate', authMiddleware, requireRole('owner', 'admin', 'editor', 'author'), async (c) => {
  const db = c.get('db');
  const original = await db.select().from(posts).where(eq(posts.id, c.req.param('id'))).get();
  if (!original) return c.json({ error: 'Not found' }, 404);

  const id = crypto.randomUUID();
  let slug = `${original.slug}-copy`;
  let existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).get();
  let n = 2;
  while (existing) { slug = `${original.slug}-copy-${n++}`; existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).get(); }

  await db.insert(posts).values({
    id, title: `${original.title} (Copy)`, slug, contentHtml: original.contentHtml,
    contentMarkdown: original.contentMarkdown, excerpt: original.excerpt, status: 'draft',
    authorId: c.get('userId')!, wordCount: original.wordCount, readingTimeMinutes: original.readingTimeMinutes,
    visibility: original.visibility, metaTitle: original.metaTitle, metaDescription: original.metaDescription,
  });
  return c.json({ id, slug }, 201);
});

// POST /api/v1/posts/:id/share — generate a secret preview link for draft sharing
postsRoutes.post('/:id/share', authMiddleware, requireRole('owner', 'admin', 'editor', 'author'), async (c) => {
  const postId = c.req.param('id');
  const token = crypto.randomUUID();
  await c.env.SESSIONS.put(`preview:${token}`, postId, { expirationTtl: 86400 * 7 }); // 7 days
  return c.json({ url: `${c.env.SITE_URL}/preview/${token}`, expiresIn: '7 days' });
});

// GET /api/v1/posts/preview/:token — access draft via share token (no auth required)
postsRoutes.get('/preview/:token', async (c) => {
  const token = c.req.param('token');
  const postId = await c.env.SESSIONS.get(`preview:${token}`);
  if (!postId) return c.json({ error: 'Invalid or expired link' }, 404);
  const db = c.get('db');
  const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json(post);
});

// GET /api/v1/posts/:id/revisions — list revision history
postsRoutes.get('/:id/revisions', authMiddleware, async (c) => {
  const db = c.get('db');
  const revisions = await db.select().from(postRevisions)
    .where(eq(postRevisions.postId, c.req.param('id')))
    .orderBy(desc(postRevisions.createdAt)).limit(20).all();
  return c.json(revisions);
});

// POST /api/v1/posts/import-url — scrape URL and create draft
postsRoutes.post('/import-url', authMiddleware, requireRole('owner', 'admin', 'editor'), async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url) return c.json({ error: 'URL required' }, 400);

  // Fetch and extract content
  const res = await fetch(url);
  const html = await res.text();

  // Extract title from <title> or <h1>
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i) || html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || 'Imported Post';

  // Extract main content (simple: grab first <article> or <main> or body content)
  const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const contentHtml = contentMatch?.[1] || '<p>Content could not be extracted. Please edit manually.</p>';

  // Create draft
  const db = c.get('db');
  const id = crypto.randomUUID();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);

  await db.insert(posts).values({
    id, title, slug, contentHtml, status: 'draft',
    authorId: c.get('userId')!, canonicalUrl: url,
  });

  return c.json({ id, slug, title }, 201);
});
