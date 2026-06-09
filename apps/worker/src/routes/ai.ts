// AI Routes — content AI features via Workers AI + AI Gateway
// Ref: https://developers.cloudflare.com/workers-ai/models/
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { authMiddleware, requireRole } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limit';

export const aiRoutes = new Hono<AppEnv>();
aiRoutes.use('*', authMiddleware, requireRole('owner', 'admin', 'editor', 'author'));
aiRoutes.use('*', rateLimiter({ limit: 20, window: 60 }));

// POST /api/v1/ai/improve — improve writing
aiRoutes.post('/improve', async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  const result = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: 'You are a professional editor. Improve the following text for clarity, grammar, and style. Return only the improved text.' },
      { role: 'user', content: text },
    ],
  });
  return c.json({ result: (result as any).response });
});

// POST /api/v1/ai/excerpt — generate excerpt
aiRoutes.post('/excerpt', async (c) => {
  const { content, maxLength } = await c.req.json<{ content: string; maxLength?: number }>();
  const result = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: `Summarize the following blog post in ${maxLength || 160} characters or less for use as a meta description. Be concise and engaging.` },
      { role: 'user', content: content.slice(0, 3000) },
    ],
  });
  return c.json({ excerpt: (result as any).response });
});

// POST /api/v1/ai/suggest-tags
aiRoutes.post('/suggest-tags', async (c) => {
  const { title, content } = await c.req.json<{ title: string; content: string }>();
  const result = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: 'Suggest 3-5 tags for this blog post. Return as JSON array of lowercase slugs.' },
      { role: 'user', content: `Title: ${title}\n\n${content.slice(0, 2000)}` },
    ],
  });
  try { return c.json({ tags: JSON.parse((result as any).response) }); }
  catch { return c.json({ tags: [] }); }
});

// POST /api/v1/ai/search — semantic search via Vectorize
aiRoutes.post('/search', async (c) => {
  const { query } = await c.req.json<{ query: string }>();

  // Check cache
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = await c.env.SEARCH_CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));

  // Generate embedding for query
  const { data } = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
  if (!data?.[0]) return c.json({ results: [] });

  // Search Vectorize
  const matches = await c.env.VECTORIZE.query(data[0], { topK: 10, returnMetadata: 'all' });
  const results = matches.matches.map(m => ({ id: m.id, score: m.score, title: m.metadata?.title }));

  // Cache for 10 minutes
  await c.env.SEARCH_CACHE.put(cacheKey, JSON.stringify({ results }), { expirationTtl: 600 });
  return c.json({ results });
});

// POST /api/v1/ai/alt-text — generate alt text for image
aiRoutes.post('/alt-text', async (c) => {
  const { imageUrl } = await c.req.json<{ imageUrl: string }>();
  const result = await c.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
    image: await (await fetch(imageUrl)).arrayBuffer(),
    prompt: 'Describe this image in one sentence for use as alt text on a blog.',
  });
  return c.json({ altText: (result as any).description || (result as any).response });
});

// POST /api/v1/ai/social-snippets — generate social media posts
aiRoutes.post('/social-snippets', async (c) => {
  const { title, content } = await c.req.json<{ title: string; content: string }>();
  const result = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: 'Generate social media snippets for this blog post. Return JSON with keys: twitter (max 280 chars), linkedin (2-3 sentences), facebook (1-2 sentences).' },
      { role: 'user', content: `Title: ${title}\n\n${content.slice(0, 2000)}` },
    ],
  });
  try { return c.json(JSON.parse((result as any).response)); }
  catch { return c.json({ twitter: '', linkedin: '', facebook: '' }); }
});
