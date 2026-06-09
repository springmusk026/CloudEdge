// Sliding-window rate limiter using Cloudflare KV
// Ref: https://developers.cloudflare.com/kv/

import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../index';

interface RateLimitOptions {
  limit: number;   // max requests
  window: number;  // window in seconds
  keyFn?: (c: any) => string;
}

export const rateLimiter = (opts: RateLimitOptions) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const key = opts.keyFn ? opts.keyFn(c) : `rl:${ip}:${c.req.path}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - opts.window;

    const existing = await c.env.RATE_LIMITS.get(key);
    let hits: number[] = existing ? JSON.parse(existing) : [];

    // Remove expired entries
    hits = hits.filter(t => t > windowStart);

    if (hits.length >= opts.limit) {
      c.header('X-RateLimit-Limit', String(opts.limit));
      c.header('X-RateLimit-Remaining', '0');
      c.header('Retry-After', String(opts.window));
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    hits.push(now);
    await c.env.RATE_LIMITS.put(key, JSON.stringify(hits), { expirationTtl: opts.window * 2 });

    c.header('X-RateLimit-Limit', String(opts.limit));
    c.header('X-RateLimit-Remaining', String(opts.limit - hits.length));
    await next();
  });
