// Cloudflare Bindings type declarations for the entire project
// Ref: https://developers.cloudflare.com/workers/wrangler/configuration/

export interface Env {
  // D1
  DB: D1Database;
  // KV
  SESSIONS: KVNamespace;
  CACHE_RENDERED: KVNamespace;
  RATE_LIMITS: KVNamespace;
  FEATURE_FLAGS: KVNamespace;
  SITE_CONFIG: KVNamespace;
  EMAIL_QUEUE_DEDUP: KVNamespace;
  SEARCH_CACHE: KVNamespace;
  // R2
  MEDIA_UPLOADS: R2Bucket;
  MEDIA_PROCESSED: R2Bucket;
  SITE_BACKUPS: R2Bucket;
  NEWSLETTER_ARCHIVES: R2Bucket;
  IMPORT_EXPORT: R2Bucket;
  // Durable Objects
  POST_COLLABORATION: DurableObjectNamespace;
  LIVE_COMMENTS: DurableObjectNamespace;
  ANALYTICS: DurableObjectNamespace;
  BUILD_QUEUE: DurableObjectNamespace;
  // Queues
  IMAGE_QUEUE: Queue;
  EMAIL_QUEUE: Queue;
  // Vectorize
  VECTORIZE: VectorizeIndex;
  // AI
  AI: Ai;
  // Vars
  ENVIRONMENT: string;
  SITE_URL: string;
  R2_PUBLIC_URL: string;
  // Secrets
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

// ─── Enums ───
export const UserRole = ['owner', 'admin', 'editor', 'author', 'contributor', 'subscriber'] as const;
export type UserRole = (typeof UserRole)[number];

export const PostStatus = ['draft', 'scheduled', 'published', 'private', 'archived'] as const;
export type PostStatus = (typeof PostStatus)[number];

export const PostVisibility = ['public', 'members', 'paid', 'specific_tier'] as const;
export type PostVisibility = (typeof PostVisibility)[number];

export const CommentStatus = ['pending', 'approved', 'spam', 'deleted'] as const;
export type CommentStatus = (typeof CommentStatus)[number];

export const NewsletterStatus = ['draft', 'scheduled', 'sending', 'sent', 'failed'] as const;
export type NewsletterStatus = (typeof NewsletterStatus)[number];

export const MembershipTier = ['free', 'monthly', 'yearly', 'lifetime', 'custom'] as const;
export type MembershipTier = (typeof MembershipTier)[number];

export const MembershipStatus = ['active', 'cancelled', 'past_due', 'trialing'] as const;
export type MembershipStatus = (typeof MembershipStatus)[number];

export const MediaVariant = ['thumbnail', 'small', 'medium', 'large', 'webp_medium'] as const;
export type MediaVariant = (typeof MediaVariant)[number];

export const CommentReaction = ['like', 'dislike', 'laugh', 'wow'] as const;
export type CommentReaction = (typeof CommentReaction)[number];
