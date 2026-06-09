// AnalyticsDO — Buffers page view events, flushes to D1 in batches
// Prevents D1 write storms from high traffic

import { DurableObject } from 'cloudflare:workers';

interface ViewEvent { postId: string; ip: string; timestamp: number }

export class AnalyticsDO extends DurableObject {
  private buffer: ViewEvent[] = [];
  private flushAlarmSet = false;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/track' && request.method === 'POST') {
      const { postId, ip } = await request.json() as { postId: string; ip: string };
      this.buffer.push({ postId, ip, timestamp: Date.now() });

      // Set alarm to flush every 60s
      if (!this.flushAlarmSet) {
        await this.ctx.storage.setAlarm(Date.now() + 60000);
        this.flushAlarmSet = true;
      }
      return new Response('ok');
    }

    if (url.pathname === '/flush') {
      await this.flush();
      return new Response('flushed');
    }

    if (url.pathname === '/stats') {
      return new Response(JSON.stringify({ buffered: this.buffer.length }));
    }

    return new Response('Not found', { status: 404 });
  }

  async alarm() {
    await this.flush();
    this.flushAlarmSet = false;
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    // Aggregate by postId + date
    const today = new Date().toISOString().slice(0, 10);
    const counts = new Map<string, { views: number; uniqueIps: Set<string> }>();

    for (const ev of events) {
      const key = ev.postId;
      if (!counts.has(key)) counts.set(key, { views: 0, uniqueIps: new Set() });
      const entry = counts.get(key)!;
      entry.views++;
      entry.uniqueIps.add(ev.ip);
    }

    // Write to D1 via binding (passed in env at construction)
    const db = (this.env as any).DB as D1Database;
    const stmt = db.prepare(
      `INSERT INTO post_analytics_daily (post_id, date, views, unique_visitors)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (post_id, date) DO UPDATE SET
         views = views + excluded.views,
         unique_visitors = unique_visitors + excluded.unique_visitors`
    );

    const batch = [...counts.entries()].map(([postId, data]) =>
      stmt.bind(postId, today, data.views, data.uniqueIps.size)
    );

    if (batch.length) await db.batch(batch);

    // Update site totals
    const totalViews = events.length;
    const uniqueTotal = new Set(events.map(e => e.ip)).size;
    await db.prepare(
      `INSERT INTO site_analytics_daily (date, total_views, unique_visitors)
       VALUES (?, ?, ?)
       ON CONFLICT (date) DO UPDATE SET
         total_views = total_views + excluded.total_views,
         unique_visitors = unique_visitors + excluded.unique_visitors`
    ).bind(today, totalViews, uniqueTotal).run();
  }
}
