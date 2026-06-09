// Auth Middleware — JWT-based sessions with KV storage
// Uses crypto.subtle (available in Workers) for HMAC-SHA256 verification

import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../index';

interface JWTPayload { sub: string; role: string; exp: number; iat: number }

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return null;

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(`${headerB64}.${payloadB64}`));
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

export async function signJWT(payload: Omit<JWTPayload, 'iat'>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const iat = Math.floor(Date.now() / 1000);
  const body = btoa(JSON.stringify({ ...payload, iat })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.${sigB64}`;
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  // Check if session is still valid in KV
  const session = await c.env.SESSIONS.get(`session:${token}`);
  if (!session) {
    // Try JWT verification as fallback (for API keys)
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);
    c.set('userId', payload.sub);
    c.set('userRole', payload.role);
    return next();
  }

  const sessionData = JSON.parse(session) as { userId: string; role: string };
  c.set('userId', sessionData.userId);
  c.set('userRole', sessionData.role);
  await next();
});

export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    const session = await c.env.SESSIONS.get(`session:${token}`);
    if (session) {
      const data = JSON.parse(session) as { userId: string; role: string };
      c.set('userId', data.userId);
      c.set('userRole', data.role);
    }
  }
  await next();
});

export const requireRole = (...roles: string[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const role = c.get('userRole');
    if (!role || !roles.includes(role)) return c.json({ error: 'Forbidden' }, 403);
    await next();
  });
