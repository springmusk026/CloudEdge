// Webhooks Routes — Stripe, inbound webhook delivery
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { memberships, users } from '@cloudedge/db';
import { eq } from 'drizzle-orm';

export const webhooksHandler = new Hono<AppEnv>();

// POST /api/v1/webhooks/stripe — Stripe webhook handler
webhooksHandler.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) return c.json({ error: 'Missing signature' }, 400);

  const body = await c.req.text();

  // Verify signature using HMAC-SHA256
  const encoder = new TextEncoder();
  const [, timestamp, sig] = signature.match(/t=(\d+),v1=(.+?)(?:,|$)/) || [];
  if (!timestamp || !sig) return c.json({ error: 'Invalid signature' }, 400);

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(c.env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedHex = Array.from(new Uint8Array(expected)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (expectedHex !== sig) return c.json({ error: 'Invalid signature' }, 400);

  const event = JSON.parse(body);
  const db = c.get('db');

  switch (event.type) {
    case 'checkout.session.completed': {
      const { customer, subscription, metadata } = event.data.object;
      if (metadata?.userId) {
        await db.update(users).set({ stripeCustomerId: customer }).where(eq(users.id, metadata.userId));
        await db.insert(memberships).values({
          id: crypto.randomUUID(), userId: metadata.userId,
          tier: metadata.tier || 'monthly', status: 'active',
          stripeSubscriptionId: subscription,
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subId = event.data.object.id;
      await db.update(memberships).set({ status: 'cancelled' }).where(eq(memberships.stripeSubscriptionId, subId));
      break;
    }
    case 'invoice.payment_failed': {
      const subId = event.data.object.subscription;
      await db.update(memberships).set({ status: 'past_due' }).where(eq(memberships.stripeSubscriptionId, subId));
      break;
    }
  }

  return c.json({ received: true });
});
