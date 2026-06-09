// Image Processor Queue Consumer — generates responsive image variants
// Ref: https://developers.cloudflare.com/queues/

interface Env {
  MEDIA_UPLOADS: R2Bucket;
  MEDIA_PROCESSED: R2Bucket;
  DB: D1Database;
}

interface ImageJob {
  type: 'image_process';
  payload: { mediaId: string; r2Key: string; mimeType: string };
}

const VARIANTS = [
  { name: 'thumbnail', width: 320 },
  { name: 'small', width: 640 },
  { name: 'medium', width: 1280 },
  { name: 'large', width: 2560 },
] as const;

export default {
  async queue(batch: MessageBatch<ImageJob>, env: Env) {
    for (const msg of batch.messages) {
      const { mediaId, r2Key, mimeType } = msg.body.payload;

      try {
        // Get original image from R2
        const original = await env.MEDIA_UPLOADS.get(r2Key);
        if (!original) { msg.ack(); continue; }

        const originalBuffer = await original.arrayBuffer();

        // Generate variants using Cloudflare Image Resizing via fetch
        // Ref: https://developers.cloudflare.com/images/transform-images/transform-via-workers/
        for (const variant of VARIANTS) {
          const variantKey = `${mediaId}/${variant.name}.webp`;

          // Use cf.image transform to resize
          // In production, this would use Cloudflare Image Resizing:
          // const resized = await fetch(originalUrl, { cf: { image: { width: variant.width, format: 'webp' } } });
          // For now, store original as variant placeholder (real impl needs Image Resizing enabled)
          await env.MEDIA_PROCESSED.put(variantKey, originalBuffer, {
            httpMetadata: { contentType: 'image/webp' },
            customMetadata: { originalMediaId: mediaId, variant: variant.name, width: String(variant.width) },
          });

          // Record variant in D1
          await env.DB.prepare(
            `INSERT INTO media_variants (id, media_id, r2_key, variant_name, width, file_size_bytes) VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(crypto.randomUUID(), mediaId, variantKey, variant.name, variant.width, originalBuffer.byteLength).run();
        }

        // Generate blurhash placeholder (simplified — real impl would compute actual blurhash)
        const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'; // placeholder
        await env.DB.prepare('UPDATE media SET blurhash = ? WHERE id = ?').bind(blurhash, mediaId).run();

        msg.ack();
      } catch (e) {
        console.error(`Image processing failed for ${mediaId}:`, e);
        msg.retry({ delaySeconds: 30 });
      }
    }
  },
};
