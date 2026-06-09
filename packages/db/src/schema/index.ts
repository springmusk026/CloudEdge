// D1 Schema — Drizzle ORM
// Ref: https://developers.cloudflare.com/d1/sql-api/foreign-keys/
// Ref: https://orm.drizzle.team/docs/connect-cloudflare-d1

import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ───
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  avatarR2Key: text('avatar_r2_key'),
  role: text('role', { enum: ['owner', 'admin', 'editor', 'author', 'contributor', 'subscriber'] }).notNull().default('subscriber'),
  bio: text('bio'),
  socialLinks: text('social_links', { mode: 'json' }).$type<Record<string, string>>(),
  stripeCustomerId: text('stripe_customer_id'),
  membershipTier: text('membership_tier'),
  twoFactorSecret: text('two_factor_secret'),
  backupCodes: text('backup_codes', { mode: 'json' }).$type<string[]>(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  lastLogin: text('last_login'),
}, (t) => [
  index('idx_users_role').on(t.role),
]);

// ─── Posts ───
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  contentHtml: text('content_html'),
  contentMarkdown: text('content_markdown'),
  excerpt: text('excerpt'),
  status: text('status', { enum: ['draft', 'scheduled', 'published', 'private', 'archived'] }).notNull().default('draft'),
  authorId: text('author_id').notNull().references(() => users.id),
  primaryImageR2Key: text('primary_image_r2_key'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  ogImageR2Key: text('og_image_r2_key'),
  schemaMarkup: text('schema_markup', { mode: 'json' }),
  readingTimeMinutes: integer('reading_time_minutes'),
  wordCount: integer('word_count'),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  pinned: integer('pinned', { mode: 'boolean' }).default(false),
  allowComments: integer('allow_comments', { mode: 'boolean' }).default(true),
  canonicalUrl: text('canonical_url'),
  visibility: text('visibility', { enum: ['public', 'members', 'paid', 'specific_tier'] }).notNull().default('public'),
  publishedAt: text('published_at'),
  scheduledAt: text('scheduled_at'),
  revisionCount: integer('revision_count').default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_posts_status').on(t.status),
  index('idx_posts_author').on(t.authorId),
  index('idx_posts_published').on(t.publishedAt),
  index('idx_posts_slug').on(t.slug),
]);

// ─── Post Revisions ───
export const postRevisions = sqliteTable('post_revisions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  contentHtml: text('content_html'),
  contentMarkdown: text('content_markdown'),
  changedBy: text('changed_by').references(() => users.id),
  revisionNote: text('revision_note'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_revisions_post').on(t.postId),
]);

// ─── Tags ───
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverImageR2Key: text('cover_image_r2_key'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Post Tags (M2M) ───
export const postTags = sqliteTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.postId, t.tagId] }),
]);

// ─── Series ───
export const series = sqliteTable('series', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverImageR2Key: text('cover_image_r2_key'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Post Series (M2M) ───
export const postSeries = sqliteTable('post_series', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  seriesId: text('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull().default(0),
}, (t) => [
  primaryKey({ columns: [t.postId, t.seriesId] }),
]);

// ─── Comments ───
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  authorId: text('author_id').references(() => users.id),
  guestName: text('guest_name'),
  guestEmail: text('guest_email'),
  bodyHtml: text('body_html').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'spam', 'deleted'] }).notNull().default('pending'),
  ipHash: text('ip_hash'),
  upvotes: integer('upvotes').default(0),
  editedAt: text('edited_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_comments_post').on(t.postId),
  index('idx_comments_status').on(t.status),
]);

// ─── Comment Reactions ───
export const commentReactions = sqliteTable('comment_reactions', {
  commentId: text('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  reaction: text('reaction', { enum: ['like', 'dislike', 'laugh', 'wow'] }).notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  primaryKey({ columns: [t.commentId, t.userId] }),
]);

// ─── Media ───
export const media = sqliteTable('media', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  r2Key: text('r2_key').notNull().unique(),
  originalFilename: text('original_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  blurhash: text('blurhash'),
  altText: text('alt_text'),
  caption: text('caption'),
  folderPath: text('folder_path').default('/'),
  uploadedBy: text('uploaded_by').references(() => users.id),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_media_folder').on(t.folderPath),
  index('idx_media_uploaded_by').on(t.uploadedBy),
]);

// ─── Media Variants ───
export const mediaVariants = sqliteTable('media_variants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mediaId: text('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
  r2Key: text('r2_key').notNull(),
  variantName: text('variant_name', { enum: ['thumbnail', 'small', 'medium', 'large', 'webp_medium'] }).notNull(),
  width: integer('width'),
  height: integer('height'),
  fileSizeBytes: integer('file_size_bytes'),
}, (t) => [
  index('idx_variants_media').on(t.mediaId),
]);

// ─── Newsletters ───
export const newsletters = sqliteTable('newsletters', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  subject: text('subject').notNull(),
  previewText: text('preview_text'),
  contentHtml: text('content_html'),
  status: text('status', { enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'] }).notNull().default('draft'),
  scheduledAt: text('scheduled_at'),
  sentAt: text('sent_at'),
  recipientCount: integer('recipient_count').default(0),
  openCount: integer('open_count').default(0),
  clickCount: integer('click_count').default(0),
  bounceCount: integer('bounce_count').default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Newsletter Subscribers ───
export const newsletterSubscribers = sqliteTable('newsletter_subscribers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  subscribedAt: text('subscribed_at').notNull().default(sql`(datetime('now'))`),
  confirmedAt: text('confirmed_at'),
  unsubscribedAt: text('unsubscribed_at'),
  source: text('source'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  cfGeoCountry: text('cf_geo_country'),
});

// ─── Newsletter Sends ───
export const newsletterSends = sqliteTable('newsletter_sends', {
  newsletterId: text('newsletter_id').notNull().references(() => newsletters.id, { onDelete: 'cascade' }),
  subscriberId: text('subscriber_id').notNull().references(() => newsletterSubscribers.id),
  sentAt: text('sent_at'),
  openedAt: text('opened_at'),
  clickedAt: text('clicked_at'),
  bouncedAt: text('bounced_at'),
}, (t) => [
  primaryKey({ columns: [t.newsletterId, t.subscriberId] }),
]);

// ─── Memberships ───
export const memberships = sqliteTable('memberships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  tier: text('tier', { enum: ['free', 'monthly', 'yearly', 'lifetime', 'custom'] }).notNull(),
  status: text('status', { enum: ['active', 'cancelled', 'past_due', 'trialing'] }).notNull().default('active'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  startedAt: text('started_at').notNull().default(sql`(datetime('now'))`),
  expiresAt: text('expires_at'),
  pricePaid: integer('price_paid'),
  currency: text('currency').default('usd'),
}, (t) => [
  index('idx_memberships_user').on(t.userId),
]);

// ─── Forms ───
export const forms = sqliteTable('forms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  fieldsSchema: text('fields_schema', { mode: 'json' }),
  notifications: text('notifications', { mode: 'json' }),
  successMessage: text('success_message'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Form Submissions ───
export const formSubmissions = sqliteTable('form_submissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  formId: text('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  data: text('data', { mode: 'json' }),
  submitterIpHash: text('submitter_ip_hash'),
  submitterCountry: text('submitter_country'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Settings ───
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  updatedBy: text('updated_by').references(() => users.id),
});

// ─── API Keys ───
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  scopes: text('scopes', { mode: 'json' }).$type<string[]>(),
  lastUsedAt: text('last_used_at'),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Redirects ───
export const redirects = sqliteTable('redirects', {
  sourcePath: text('source_path').primaryKey(),
  destinationUrl: text('destination_url').notNull(),
  statusCode: integer('status_code').notNull().default(301),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Webhooks ───
export const webhooks = sqliteTable('webhooks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  url: text('url').notNull(),
  events: text('events', { mode: 'json' }).$type<string[]>(),
  secret: text('secret').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  lastTriggeredAt: text('last_triggered_at'),
  failureCount: integer('failure_count').default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Audit Log ───
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  diffJson: text('diff_json', { mode: 'json' }),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_audit_user').on(t.userId),
  index('idx_audit_resource').on(t.resourceType, t.resourceId),
  index('idx_audit_created').on(t.createdAt),
]);

// ─── Post Analytics Daily ───
export const postAnalyticsDaily = sqliteTable('post_analytics_daily', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  views: integer('views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  avgReadTimeSeconds: integer('avg_read_time_seconds').default(0),
  scrollDepthAvg: real('scroll_depth_avg').default(0),
}, (t) => [
  primaryKey({ columns: [t.postId, t.date] }),
]);

// ─── Site Analytics Daily ───
export const siteAnalyticsDaily = sqliteTable('site_analytics_daily', {
  date: text('date').primaryKey(),
  totalViews: integer('total_views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  topPostsJson: text('top_posts_json', { mode: 'json' }),
  topReferrersJson: text('top_referrers_json', { mode: 'json' }),
  countryBreakdownJson: text('country_breakdown_json', { mode: 'json' }),
});
