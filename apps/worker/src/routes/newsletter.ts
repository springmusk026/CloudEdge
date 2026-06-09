// Newsletter Routes — subscriber management, campaign CRUD, sends
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { newsletters, newsletterSubscribers, newsletterSends } from '@cloudedge/db';
import { eq, isNull, isNotNull, desc, sql } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limit';

export const newsletterRoutes = new Hono<AppEnv>();

// POST /api/v1/newsletter/subscribe — public subscribe
newsletterRoutes.post('/subscribe', rateLimiter({ limit: 5, window: 60 }), async (c) => {
  const { email, name, source } = await c.req.json<{ email: string; name?: string; source?: string }>();
  if (!email) return c.json({ error: 'Email required' }, 400);

  const db = c.get('db');
  const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).get();
  if (existing) return c.json({ ok: true, message: 'Already subscribed' });

  const id = crypto.randomUUID();
  const country = c.req.header('CF-IPCountry') || undefined;

  await db.insert(newsletterSubscribers).values({ id, email, name, source, cfGeoCountry: country });

  // Send double opt-in email
  const token = crypto.randomUUID();
  await c.env.SESSIONS.put(`confirm:${token}`, id, { expirationTtl: 86400 });
  await c.env.EMAIL_QUEUE.send({ type: 'email_send', payload: {
    to: email, template: 'confirm-subscription',
    data: { name, url: `${c.env.SITE_URL}/api/v1/newsletter/confirm?token=${token}` },
  }});

  return c.json({ ok: true, message: 'Confirmation email sent' }, 201);
});

// GET /api/v1/newsletter/confirm — confirm subscription
newsletterRoutes.get('/confirm', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'Missing token' }, 400);

  const subscriberId = await c.env.SESSIONS.get(`confirm:${token}`);
  if (!subscriberId) return c.json({ error: 'Invalid or expired token' }, 404);

  await c.get('db').update(newsletterSubscribers)
    .set({ confirmedAt: new Date().toISOString() })
    .where(eq(newsletterSubscribers.id, subscriberId));
  await c.env.SESSIONS.delete(`confirm:${token}`);

  return c.redirect(`${c.env.SITE_URL}/newsletter/confirmed`);
});

// GET /api/v1/newsletter/unsubscribe
newsletterRoutes.get('/unsubscribe', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'Missing token' }, 400);

  const subscriberId = await c.env.SESSIONS.get(`unsub:${token}`);
  if (!subscriberId) return c.json({ error: 'Invalid token' }, 404);

  await c.get('db').update(newsletterSubscribers)
    .set({ unsubscribedAt: new Date().toISOString() })
    .where(eq(newsletterSubscribers.id, subscriberId));

  return c.redirect(`${c.env.SITE_URL}/newsletter/unsubscribed`);
});

// ─── Admin Routes ───

// GET /api/v1/newsletter/subscribers
newsletterRoutes.get('/subscribers', authMiddleware, requireRole('owner', 'admin', 'editor'), async (c) => {
  const db = c.get('db');
  const page = Number(c.req.query('page') || '1');
  const limit = 50;
  const results = await db.select().from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt))
    .orderBy(desc(newsletterSubscribers.subscribedAt))
    .limit(limit).offset((page - 1) * limit).all();
  const total = await db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt)).get();
  return c.json({ subscribers: results, total: total?.count || 0 });
});

// GET /api/v1/newsletter/campaigns
newsletterRoutes.get('/campaigns', authMiddleware, requireRole('owner', 'admin', 'editor'), async (c) => {
  const results = await c.get('db').select().from(newsletters).orderBy(desc(newsletters.createdAt)).all();
  return c.json(results);
});

// POST /api/v1/newsletter/campaigns
newsletterRoutes.post('/campaigns', authMiddleware, requireRole('owner', 'admin', 'editor'), async (c) => {
  const { subject, previewText, contentHtml } = await c.req.json<{ subject: string; previewText?: string; contentHtml: string }>();
  const id = crypto.randomUUID();
  await c.get('db').insert(newsletters).values({ id, subject, previewText, contentHtml });
  return c.json({ id }, 201);
});

// POST /api/v1/newsletter/campaigns/:id/send
newsletterRoutes.post('/campaigns/:id/send', authMiddleware, requireRole('owner', 'admin'), async (c) => {
  const db = c.get('db');
  const campaignId = c.req.param('id');

  const campaign = await db.select().from(newsletters).where(eq(newsletters.id, campaignId)).get();
  if (!campaign) return c.json({ error: 'Campaign not found' }, 404);
  if (campaign.status === 'sent') return c.json({ error: 'Already sent' }, 400);

  // Get confirmed, subscribed subscribers
  const subscribers = await db.select().from(newsletterSubscribers)
    .where(isNotNull(newsletterSubscribers.confirmedAt)).all()
    .then(s => s.filter(sub => !sub.unsubscribedAt));

  await db.update(newsletters).set({ status: 'sending', recipientCount: subscribers.length }).where(eq(newsletters.id, campaignId));

  // Queue sends via BuildQueue DO for rate-limited delivery
  const doId = c.env.BUILD_QUEUE.idFromName('newsletter');
  const stub = c.env.BUILD_QUEUE.get(doId);
  await stub.fetch(new Request('http://internal/enqueue', {
    method: 'POST',
    body: JSON.stringify({ campaignId, subscribers: subscribers.map(s => ({ id: s.id, email: s.email, name: s.name })) }),
  }));

  return c.json({ ok: true, recipientCount: subscribers.length });
});
