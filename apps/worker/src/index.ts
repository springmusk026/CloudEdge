// CloudEdge CMS — Main Worker Entry Point
// Ref: https://hono.dev/docs/getting-started/cloudflare-workers
// Ref: https://developers.cloudflare.com/workers/

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import type { Env } from '@cloudedge/shared';
import { createDb, posts } from '@cloudedge/db';
import { eq, and, lte } from 'drizzle-orm';
import { authMiddleware, optionalAuth } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limit';
import { postsRoutes } from './routes/posts';
import { authRoutes } from './routes/auth';
import { tagsRoutes } from './routes/tags';
import { mediaRoutes } from './routes/media';
import { commentsRoutes } from './routes/comments';
import { newsletterRoutes } from './routes/newsletter';
import { adminRoutes } from './routes/admin';
import { publicRoutes } from './routes/public';
import { aiRoutes } from './routes/ai';
import { webhooksHandler } from './routes/webhooks';
import { PostCollaborationDO } from './durable-objects/post-collaboration';
import { LiveCommentsDO } from './durable-objects/live-comments';
import { AnalyticsDO } from './durable-objects/analytics';
import { BuildQueueDO } from './durable-objects/build-queue';

export type AppEnv = { Bindings: Env; Variables: { userId?: string; userRole?: string; db: ReturnType<typeof createDb> } };

const app = new Hono<AppEnv>();

// ─── Global Middleware ───
app.use('*', logger());
app.use('*', secureHeaders());
app.use('/api/*', cors({ origin: (origin) => origin || '*', credentials: true }));
app.use('/api/*', async (c, next) => {
  c.set('db', createDb(c.env.DB));
  await next();
});

// ─── Health Check ───
app.get('/healthz', async (c) => {
  try {
    const db = createDb(c.env.DB);
    await c.env.DB.prepare('SELECT 1').first();
    await c.env.SESSIONS.get('__healthcheck');
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (e: any) {
    return c.json({ status: 'error', message: e.message }, 500);
  }
});

// ─── Public API (rate limited) ───
app.use('/api/v1/*', rateLimiter({ limit: 100, window: 60 }));

// ─── Routes ───
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/posts', postsRoutes);
app.route('/api/v1/tags', tagsRoutes);
app.route('/api/v1/media', mediaRoutes);
app.route('/api/v1/comments', commentsRoutes);
app.route('/api/v1/newsletter', newsletterRoutes);
app.route('/api/v1/ai', aiRoutes);
app.route('/api/v1/admin', adminRoutes);
app.route('/api/v1/webhooks', webhooksHandler);
app.route('', publicRoutes);

// ─── 404 Fallback ───
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// ─── Error Handler ───
app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  return c.json({ error: c.env.ENVIRONMENT === 'production' ? 'Internal Server Error' : err.message }, 500);
});

// ─── Exports ───
export default {
  fetch: app.fetch,
  // Queue consumer handler
  async queue(batch: MessageBatch, env: Env) {
    for (const msg of batch.messages) {
      const { type, payload } = msg.body as { type: string; payload: any };
      try {
        if (type === 'image_process') {
          // handled by image-processor worker
        } else if (type === 'email_send') {
          // handled by email-sender worker
        }
        msg.ack();
      } catch (e) {
        msg.retry();
      }
    }
  },
  // Cron triggers — auto-publish scheduled posts
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const db = createDb(env.DB);
    // Publish scheduled posts whose scheduledAt is in the past
    const now = new Date().toISOString();
    const scheduled = await db.select({ id: posts.id, slug: posts.slug })
      .from(posts)
      .where(and(eq(posts.status, 'scheduled'), lte(posts.scheduledAt, now)))
      .all();

    for (const post of scheduled) {
      await db.update(posts).set({ status: 'published', publishedAt: now, updatedAt: now }).where(eq(posts.id, post.id));
      await env.CACHE_RENDERED.delete(`post:${post.slug}`);
    }
    await env.CACHE_RENDERED.delete('homepage');
    await env.CACHE_RENDERED.delete('rss');
    await env.CACHE_RENDERED.delete('sitemap');

    // Flush analytics DO to D1
    const id = env.ANALYTICS.idFromName('global');
    const stub = env.ANALYTICS.get(id);
    await stub.fetch(new Request('http://internal/flush'));
  },
};

export { PostCollaborationDO, LiveCommentsDO, AnalyticsDO, BuildQueueDO };
