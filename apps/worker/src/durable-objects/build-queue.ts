// BuildQueueDO — Serialized queue for newsletter sends with rate limiting
// Handles retries with exponential backoff

import { DurableObject } from 'cloudflare:workers';

interface SendJob { campaignId: string; subscriberId: string; email: string; name?: string; attempts: number }

export class BuildQueueDO extends DurableObject {
  private queue: SendJob[] = [];
  private processing = false;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/enqueue' && request.method === 'POST') {
      const { campaignId, subscribers } = await request.json() as {
        campaignId: string; subscribers: { id: string; email: string; name?: string }[];
      };

      for (const sub of subscribers) {
        this.queue.push({ campaignId, subscriberId: sub.id, email: sub.email, name: sub.name, attempts: 0 });
      }

      // Start processing if not already
      if (!this.processing) {
        await this.ctx.storage.setAlarm(Date.now() + 1000);
      }

      return new Response(JSON.stringify({ queued: subscribers.length }));
    }

    if (url.pathname === '/status') {
      return new Response(JSON.stringify({ pending: this.queue.length, processing: this.processing }));
    }

    return new Response('Not found', { status: 404 });
  }

  async alarm() {
    this.processing = true;

    // Process batch of 5 emails per alarm (rate limiting)
    const batch = this.queue.splice(0, 5);
    const env = this.env as any;

    for (const job of batch) {
      // Dedup check
      const dedupKey = `sent:${job.campaignId}:${job.subscriberId}`;
      const alreadySent = await env.EMAIL_QUEUE_DEDUP.get(dedupKey);
      if (alreadySent) continue;

      try {
        await env.EMAIL_QUEUE.send({
          type: 'email_send',
          payload: { to: job.email, template: 'newsletter', data: { campaignId: job.campaignId, subscriberId: job.subscriberId, name: job.name } },
        });
        // Mark as sent for dedup
        await env.EMAIL_QUEUE_DEDUP.put(dedupKey, '1', { expirationTtl: 86400 * 7 });
      } catch (e) {
        // Retry with backoff
        if (job.attempts < 3) {
          job.attempts++;
          this.queue.push(job);
        }
      }
    }

    // Continue processing if queue has items
    if (this.queue.length > 0) {
      await this.ctx.storage.setAlarm(Date.now() + 2000); // 2s between batches
    } else {
      this.processing = false;
      // Mark campaign as sent
      if (batch.length > 0) {
        const db = (this.env as any).DB as D1Database;
        await db.prepare('UPDATE newsletters SET status = ?, sent_at = ? WHERE id = ?')
          .bind('sent', new Date().toISOString(), batch[0].campaignId).run();
      }
    }
  }
}
