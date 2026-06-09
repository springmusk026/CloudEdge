// Comments Routes — threaded comments with moderation
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { comments, users, commentReactions } from '@cloudedge/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limit';

export const commentsRoutes = new Hono<AppEnv>();

// GET /api/v1/comments?postId=xxx — public approved comments
commentsRoutes.get('/', async (c) => {
  const db = c.get('db');
  const postId = c.req.query('postId');
  if (!postId) return c.json({ error: 'postId required' }, 400);

  const results = await db.select({
    id: comments.id, postId: comments.postId, parentId: comments.parentId,
    authorId: comments.authorId, guestName: comments.guestName,
    bodyHtml: comments.bodyHtml, upvotes: comments.upvotes, createdAt: comments.createdAt,
  }).from(comments)
    .where(and(eq(comments.postId, postId), eq(comments.status, 'approved')))
    .orderBy(desc(comments.createdAt)).all();

  return c.json(results);
});

// POST /api/v1/comments — create comment (authed or guest)
commentsRoutes.post('/', optionalAuth, rateLimiter({ limit: 10, window: 60 }), async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { postId, parentId, bodyHtml, guestName, guestEmail } = await c.req.json<{
    postId: string; parentId?: string; bodyHtml: string; guestName?: string; guestEmail?: string;
  }>();

  if (!postId || !bodyHtml) return c.json({ error: 'Missing fields' }, 400);
  if (!userId && !guestName) return c.json({ error: 'Name required for guests' }, 400);

  const ipHash = await hashIP(c.req.header('CF-Connecting-IP') || '');

  // Auto-moderate with AI (non-blocking)
  const id = crypto.randomUUID();
  let status: 'pending' | 'approved' = 'pending';

  // Auto-approve for trusted users
  if (userId) {
    const user = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).get();
    if (user && ['owner', 'admin', 'editor', 'author'].includes(user.role)) {
      status = 'approved';
    }
  }

  await db.insert(comments).values({
    id, postId, parentId, authorId: userId, guestName, guestEmail,
    bodyHtml, status, ipHash,
  });

  // Notify via Live Comments DO
  const doId = c.env.LIVE_COMMENTS.idFromName(postId);
  const stub = c.env.LIVE_COMMENTS.get(doId);
  c.executionCtx.waitUntil(stub.fetch(new Request('http://internal/broadcast', {
    method: 'POST', body: JSON.stringify({ type: 'new_comment', commentId: id, status }),
  })));

  return c.json({ id, status }, 201);
});

// PATCH /api/v1/comments/:id/moderate — admin moderation
commentsRoutes.patch('/:id/moderate', authMiddleware, requireRole('owner', 'admin', 'editor'), async (c) => {
  const { status } = await c.req.json<{ status: 'approved' | 'spam' | 'deleted' }>();
  await c.get('db').update(comments).set({ status }).where(eq(comments.id, c.req.param('id')));
  return c.json({ ok: true });
});

// POST /api/v1/comments/:id/react — like/react to a comment
commentsRoutes.post('/:id/react', optionalAuth, async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ error: 'Login required to react' }, 401);
  const { reaction } = await c.req.json<{ reaction: string }>();
  const db = c.get('db');
  // Upsert reaction
  await db.delete(commentReactions).where(and(eq(commentReactions.commentId, c.req.param('id')), eq(commentReactions.userId, userId)));
  await db.insert(commentReactions).values({ commentId: c.req.param('id'), userId, reaction: reaction as any });
  // Update upvote count
  const count = await db.select({ count: sql<number>`count(*)` }).from(commentReactions).where(eq(commentReactions.commentId, c.req.param('id'))).get();
  await db.update(comments).set({ upvotes: count?.count || 0 }).where(eq(comments.id, c.req.param('id')));
  return c.json({ ok: true, count: count?.count || 0 });
});

async function hashIP(ip: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + 'cloudedge-salt'));
  return Array.from(new Uint8Array(hash)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}
