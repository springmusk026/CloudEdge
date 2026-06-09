// Auth Routes — email/password, magic link, OAuth
// Uses crypto.subtle for password hashing (bcrypt not available in Workers, using PBKDF2)

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { users } from '@cloudedge/db';
import { eq } from 'drizzle-orm';
import { signJWT } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';

export const authRoutes = new Hono<AppEnv>();

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  const saltB64 = btoa(String.fromCharCode(...salt));
  return `${saltB64}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':');
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits))) === hashB64;
}

// POST /api/v1/auth/register
authRoutes.post('/register', async (c) => {
  const { email, name, password } = await c.req.json<{ email: string; name: string; password: string }>();
  if (!email || !name || !password) return c.json({ error: 'Missing fields' }, 400);

  const db = c.get('db');
  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) return c.json({ error: 'Email already registered' }, 409);

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  await db.insert(users).values({ id, email, name, passwordHash, role: 'subscriber' });

  const token = await signJWT({ sub: id, role: 'subscriber', exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, c.env.JWT_SECRET);
  await c.env.SESSIONS.put(`session:${token}`, JSON.stringify({ userId: id, role: 'subscriber' }), { expirationTtl: 86400 * 7 });

  return c.json({ token, user: { id, email, name, role: 'subscriber' } }, 201);
});

// POST /api/v1/auth/login
authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const db = c.get('db');

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !user.passwordHash) return c.json({ error: 'Invalid credentials' }, 401);
  if (!(await verifyPassword(password, user.passwordHash))) return c.json({ error: 'Invalid credentials' }, 401);

  await db.update(users).set({ lastLogin: new Date().toISOString() }).where(eq(users.id, user.id));

  const token = await signJWT({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, c.env.JWT_SECRET);
  await c.env.SESSIONS.put(`session:${token}`, JSON.stringify({ userId: user.id, role: user.role }), { expirationTtl: 86400 * 7 });

  return c.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// POST /api/v1/auth/magic-link
authRoutes.post('/magic-link', async (c) => {
  const { email } = await c.req.json<{ email: string }>();
  const db = c.get('db');

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return c.json({ ok: true }); // Don't reveal if email exists

  const token = crypto.randomUUID();
  await c.env.SESSIONS.put(`magic:${token}`, JSON.stringify({ userId: user.id, role: user.role }), { expirationTtl: 900 });

  // Queue email send
  await c.env.EMAIL_QUEUE.send({ type: 'email_send', payload: { to: email, template: 'magic-link', data: { token, name: user.name, url: `${c.env.SITE_URL}/api/v1/auth/magic-link/verify?token=${token}` } } });

  return c.json({ ok: true });
});

// GET /api/v1/auth/magic-link/verify
authRoutes.get('/magic-link/verify', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'Missing token' }, 400);

  const data = await c.env.SESSIONS.get(`magic:${token}`);
  if (!data) return c.json({ error: 'Invalid or expired token' }, 401);
  await c.env.SESSIONS.delete(`magic:${token}`);

  const { userId, role } = JSON.parse(data);
  const sessionToken = await signJWT({ sub: userId, role, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, c.env.JWT_SECRET);
  await c.env.SESSIONS.put(`session:${sessionToken}`, JSON.stringify({ userId, role }), { expirationTtl: 86400 * 7 });

  return c.redirect(`${c.env.SITE_URL}/admin?token=${sessionToken}`);
});

// POST /api/v1/auth/logout
authRoutes.post('/logout', authMiddleware, async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.slice(7);
  if (token) await c.env.SESSIONS.delete(`session:${token}`);
  return c.json({ ok: true });
});

// GET /api/v1/auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const db = c.get('db');
  const user = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role, bio: users.bio, avatarR2Key: users.avatarR2Key }).from(users).where(eq(users.id, c.get('userId')!)).get();
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
});
