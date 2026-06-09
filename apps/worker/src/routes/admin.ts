// Admin Routes — dashboard stats, settings, users, audit log
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { users, posts, comments, newsletterSubscribers, siteAnalyticsDaily, auditLog, settings, redirects, webhooks } from '@cloudedge/db';
import { eq, desc, sql, and } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth';

export const adminRoutes = new Hono<AppEnv>();
adminRoutes.use('*', authMiddleware, requireRole('owner', 'admin', 'editor'));

// GET /api/v1/admin/dashboard
adminRoutes.get('/dashboard', async (c) => {
  const db = c.get('db');
  const [postCount, subscriberCount, commentsPending, analytics] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(posts).get(),
    db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers).get(),
    db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.status, 'pending')).get(),
    db.select().from(siteAnalyticsDaily).orderBy(desc(siteAnalyticsDaily.date)).limit(7).all(),
  ]);
  return c.json({ posts: postCount?.count, subscribers: subscriberCount?.count, pendingComments: commentsPending?.count, recentAnalytics: analytics });
});

// ─── Settings ───
adminRoutes.get('/settings', async (c) => {
  const results = await c.get('db').select().from(settings).all();
  return c.json(Object.fromEntries(results.map(s => [s.key, s.value])));
});

adminRoutes.put('/settings', requireRole('owner', 'admin'), async (c) => {
  const db = c.get('db');
  const body = await c.req.json<Record<string, any>>();
  const userId = c.get('userId')!;
  for (const [key, value] of Object.entries(body)) {
    await db.insert(settings).values({ key, value: JSON.stringify(value), updatedBy: userId })
      .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value), updatedAt: new Date().toISOString(), updatedBy: userId } });
  }
  c.executionCtx.waitUntil(c.env.SITE_CONFIG.put('settings', JSON.stringify(body), { expirationTtl: 3600 }));
  return c.json({ ok: true });
});

// ─── Users ───
adminRoutes.get('/users', async (c) => {
  const results = await c.get('db').select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt, lastLogin: users.lastLogin }).from(users).orderBy(desc(users.createdAt)).all();
  return c.json(results);
});

adminRoutes.patch('/users/:id/role', requireRole('owner'), async (c) => {
  const { role } = await c.req.json<{ role: string }>();
  await c.get('db').update(users).set({ role: role as any }).where(eq(users.id, c.req.param('id')));
  return c.json({ ok: true });
});

// ─── Redirects ───
adminRoutes.get('/redirects', async (c) => {
  return c.json(await c.get('db').select().from(redirects).all());
});

adminRoutes.post('/redirects', async (c) => {
  const body = await c.req.json<{ sourcePath: string; destinationUrl: string; statusCode?: number }>();
  await c.get('db').insert(redirects).values({ sourcePath: body.sourcePath, destinationUrl: body.destinationUrl, statusCode: body.statusCode || 301 });
  return c.json({ ok: true }, 201);
});

// ─── Audit Log ───
adminRoutes.get('/audit-log', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const results = await c.get('db').select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(50).offset((page - 1) * 50).all();
  return c.json(results);
});

// ─── Announcement Banner ───
adminRoutes.get('/banner', async (c) => {
  const cached = await c.env.SITE_CONFIG.get('banner');
  return c.json(cached ? JSON.parse(cached) : { enabled: false, text: '', url: '', style: 'info' });
});

adminRoutes.put('/banner', requireRole('owner', 'admin'), async (c) => {
  const body = await c.req.json();
  await c.env.SITE_CONFIG.put('banner', JSON.stringify(body), { expirationTtl: 86400 * 30 });
  return c.json({ ok: true });
});

// ─── Cache Purge ───
adminRoutes.post('/cache/purge', requireRole('owner', 'admin'), async (c) => {
  const { keys } = await c.req.json<{ keys?: string[] }>();
  if (keys) {
    await Promise.all(keys.map(k => c.env.CACHE_RENDERED.delete(k)));
  } else {
    // List and delete all (KV doesn't support prefix delete, so list+delete)
    const list = await c.env.CACHE_RENDERED.list();
    await Promise.all(list.keys.map(k => c.env.CACHE_RENDERED.delete(k.name)));
  }
  return c.json({ ok: true });
});


// ─── Customizer ───
adminRoutes.get('/customizer', async (c) => {
  const db = c.get('db');
  const row = await db.select().from(settings).where(eq(settings.key, 'customizer')).get();
  return c.json(row?.value || getDefaultCustomizer());
});

adminRoutes.put('/customizer', requireRole('owner', 'admin'), async (c) => {
  const db = c.get('db');
  const body = await c.req.json();
  const userId = c.get('userId')!;
  await db.insert(settings).values({ key: 'customizer', value: JSON.stringify(body), updatedBy: userId })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(body), updatedAt: new Date().toISOString(), updatedBy: userId } });
  // Cache for frontend to read without DB hit
  await c.env.SITE_CONFIG.put('customizer', JSON.stringify(body), { expirationTtl: 3600 });
  await c.env.CACHE_RENDERED.delete('customizer-css');
  return c.json({ ok: true });
});

// GET /api/v1/admin/customizer/css — public endpoint for frontend CSS
adminRoutes.get('/customizer/css', async (c) => {
  const cached = await c.env.CACHE_RENDERED.get('customizer-css');
  if (cached) { c.header('Content-Type', 'text/css'); return c.body(cached); }

  const db = c.get('db');
  const row = await db.select().from(settings).where(eq(settings.key, 'customizer')).get();
  const config = row?.value ? JSON.parse(row.value as string) : getDefaultCustomizer();
  const css = generateCSS(config);
  await c.env.CACHE_RENDERED.put('customizer-css', css, { expirationTtl: 86400 });
  c.header('Content-Type', 'text/css');
  return c.body(css);
});

function getDefaultCustomizer() {
  return {
    colors: { primary: '#0070f3', secondary: '#6b7280', accent: '#f59e0b', background: '#ffffff', foreground: '#111827', muted: '#f3f4f6', card: '#ffffff', border: '#e5e7eb' },
    darkColors: { primary: '#3b82f6', secondary: '#9ca3af', accent: '#fbbf24', background: '#030712', foreground: '#f9fafb', muted: '#1f2937', card: '#111827', border: '#374151' },
    fonts: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif', mono: 'JetBrains Mono, monospace' },
    fontSizes: { base: '16px', h1: '3rem', h2: '2rem', h3: '1.5rem' },
    spacing: { contentWidth: '768px', sidebarWidth: '280px', headerHeight: '64px' },
    borderRadius: '0.5rem',
    layout: { header: 'sticky', footer: true, sidebar: false },
    logo: { text: 'CloudEdge', imageUrl: '' },
    navigation: [{ label: 'Home', url: '/' }, { label: 'Archive', url: '/archive' }, { label: 'Newsletter', url: '/newsletter' }],
    customCSS: '',
    customHeadCode: '',
    customBodyCode: '',
  };
}

function generateCSS(config: any): string {
  const c = config.colors || {};
  const dc = config.darkColors || {};
  const f = config.fonts || {};
  const fs = config.fontSizes || {};
  const s = config.spacing || {};
  return `:root {
  --color-primary: ${c.primary || '#0070f3'};
  --color-secondary: ${c.secondary || '#6b7280'};
  --color-accent: ${c.accent || '#f59e0b'};
  --color-bg: ${c.background || '#ffffff'};
  --color-fg: ${c.foreground || '#111827'};
  --color-muted: ${c.muted || '#f3f4f6'};
  --color-card: ${c.card || '#ffffff'};
  --color-border: ${c.border || '#e5e7eb'};
  --font-heading: ${f.heading || 'Inter, system-ui, sans-serif'};
  --font-body: ${f.body || 'Inter, system-ui, sans-serif'};
  --font-mono: ${f.mono || 'monospace'};
  --font-size-base: ${fs.base || '16px'};
  --font-size-h1: ${fs.h1 || '3rem'};
  --font-size-h2: ${fs.h2 || '2rem'};
  --font-size-h3: ${fs.h3 || '1.5rem'};
  --content-width: ${s.contentWidth || '768px'};
  --header-height: ${s.headerHeight || '64px'};
  --radius: ${config.borderRadius || '0.5rem'};
}
.dark {
  --color-primary: ${dc.primary || '#3b82f6'};
  --color-secondary: ${dc.secondary || '#9ca3af'};
  --color-accent: ${dc.accent || '#fbbf24'};
  --color-bg: ${dc.background || '#030712'};
  --color-fg: ${dc.foreground || '#f9fafb'};
  --color-muted: ${dc.muted || '#1f2937'};
  --color-card: ${dc.card || '#111827'};
  --color-border: ${dc.border || '#374151'};
}
body { font-family: var(--font-body); font-size: var(--font-size-base); }
h1,h2,h3,h4 { font-family: var(--font-heading); }
${config.customCSS || ''}`;
}
