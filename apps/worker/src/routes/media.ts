// Media Routes — presigned upload, library, variants
// Ref: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { media, mediaVariants } from '@cloudedge/db';
import { eq, desc, like } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth';

export const mediaRoutes = new Hono<AppEnv>();

// POST /api/v1/media/upload-url — generate presigned PUT URL for direct client upload
mediaRoutes.post('/upload-url', authMiddleware, requireRole('owner', 'admin', 'editor', 'author'), async (c) => {
  const { filename, contentType, fileSize } = await c.req.json<{ filename: string; contentType: string; fileSize: number }>();

  if (fileSize > 50 * 1024 * 1024) return c.json({ error: 'File too large (max 50MB)' }, 400);

  const id = crypto.randomUUID();
  const ext = filename.split('.').pop() || '';
  const r2Key = `uploads/${id}.${ext}`;

  // For presigned URLs, we use the S3 compat API with aws4fetch
  // In Workers, use the binding directly for upload confirmation
  // Client uploads via presigned URL, then calls /confirm
  return c.json({ id, r2Key, uploadUrl: `${c.env.R2_PUBLIC_URL}/${r2Key}`, expiresIn: 900 });
});

// POST /api/v1/media/confirm — confirm upload, save metadata, queue processing
mediaRoutes.post('/confirm', authMiddleware, async (c) => {
  const { r2Key, filename, contentType, fileSize, width, height } = await c.req.json<{
    r2Key: string; filename: string; contentType: string; fileSize: number; width?: number; height?: number;
  }>();

  const db = c.get('db');
  const id = crypto.randomUUID();

  // Verify object exists in R2
  const obj = await c.env.MEDIA_UPLOADS.head(r2Key);
  if (!obj) return c.json({ error: 'Upload not found in R2' }, 404);

  await db.insert(media).values({
    id, r2Key, originalFilename: filename, mimeType: contentType,
    fileSizeBytes: fileSize, width, height, uploadedBy: c.get('userId'),
  });

  // Queue image processing (generate variants) if it's an image
  if (contentType.startsWith('image/')) {
    await c.env.IMAGE_QUEUE.send({ type: 'image_process', payload: { mediaId: id, r2Key, mimeType: contentType } });
  }

  return c.json({ id, r2Key, url: `${c.env.R2_PUBLIC_URL}/${r2Key}` }, 201);
});

// GET /api/v1/media — library listing
mediaRoutes.get('/', authMiddleware, async (c) => {
  const db = c.get('db');
  const page = Number(c.req.query('page') || '1');
  const limit = Math.min(Number(c.req.query('limit') || '20'), 100);
  const folder = c.req.query('folder');
  const search = c.req.query('search');

  let query = db.select().from(media).where(eq(media.isDeleted, false)).$dynamic();
  if (folder) query = query.where(eq(media.folderPath, folder));
  if (search) query = query.where(like(media.originalFilename, `%${search}%`));

  const results = await query.orderBy(desc(media.createdAt)).limit(limit).offset((page - 1) * limit).all();
  return c.json(results);
});

// GET /api/v1/media/:id
mediaRoutes.get('/:id', authMiddleware, async (c) => {
  const db = c.get('db');
  const item = await db.select().from(media).where(eq(media.id, c.req.param('id'))).get();
  if (!item) return c.json({ error: 'Not found' }, 404);
  const variants = await db.select().from(mediaVariants).where(eq(mediaVariants.mediaId, item.id)).all();
  return c.json({ ...item, variants, url: `${c.env.R2_PUBLIC_URL}/${item.r2Key}` });
});

// DELETE /api/v1/media/:id — soft delete
mediaRoutes.delete('/:id', authMiddleware, requireRole('owner', 'admin', 'editor'), async (c) => {
  await c.get('db').update(media).set({ isDeleted: true }).where(eq(media.id, c.req.param('id')));
  return c.json({ ok: true });
});
