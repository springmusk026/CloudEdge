// Tags CRUD Routes
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { tags, postTags, posts } from '@cloudedge/db';
import { eq, sql, desc } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth';

export const tagsRoutes = new Hono<AppEnv>();

// GET /api/v1/tags
tagsRoutes.get('/', async (c) => {
  const db = c.get('db');
  const results = await db.select({
    id: tags.id, name: tags.name, slug: tags.slug, description: tags.description,
    coverImageR2Key: tags.coverImageR2Key, createdAt: tags.createdAt,
    postCount: sql<number>`(SELECT count(*) FROM post_tags WHERE tag_id = ${tags.id})`,
  }).from(tags).orderBy(tags.name).all();
  return c.json(results);
});

// GET /api/v1/tags/:slug
tagsRoutes.get('/:slug', async (c) => {
  const db = c.get('db');
  const tag = await db.select().from(tags).where(eq(tags.slug, c.req.param('slug'))).get();
  if (!tag) return c.json({ error: 'Tag not found' }, 404);
  return c.json(tag);
});

// POST /api/v1/tags
tagsRoutes.post('/', authMiddleware, requireRole('owner', 'admin', 'editor'), async (c) => {
  const db = c.get('db');
  const { name, description, metaTitle, metaDescription } = await c.req.json<{ name: string; description?: string; metaTitle?: string; metaDescription?: string }>();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = crypto.randomUUID();
  await db.insert(tags).values({ id, name, slug, description, metaTitle, metaDescription });
  return c.json({ id, slug }, 201);
});

// PUT /api/v1/tags/:id
tagsRoutes.put('/:id', authMiddleware, requireRole('owner', 'admin', 'editor'), async (c) => {
  const db = c.get('db');
  const body = await c.req.json<Partial<{ name: string; description: string; metaTitle: string; metaDescription: string }>>();
  await db.update(tags).set(body).where(eq(tags.id, c.req.param('id')));
  return c.json({ ok: true });
});

// DELETE /api/v1/tags/:id
tagsRoutes.delete('/:id', authMiddleware, requireRole('owner', 'admin'), async (c) => {
  await c.get('db').delete(tags).where(eq(tags.id, c.req.param('id')));
  return c.json({ ok: true });
});
