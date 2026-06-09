-- CloudEdge CMS — Initial D1 Migration
-- Generated for Drizzle ORM + Cloudflare D1 (SQLite)
-- Ref: https://developers.cloudflare.com/d1/sql-api/foreign-keys/

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `name` text NOT NULL,
  `password_hash` text,
  `avatar_r2_key` text,
  `role` text NOT NULL DEFAULT 'subscriber',
  `bio` text,
  `social_links` text,
  `stripe_customer_id` text,
  `membership_tier` text,
  `two_factor_secret` text,
  `backup_codes` text,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `last_login` text
);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE INDEX `idx_users_role` ON `users` (`role`);

CREATE TABLE IF NOT EXISTS `posts` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `slug` text NOT NULL,
  `content_html` text,
  `content_markdown` text,
  `excerpt` text,
  `status` text NOT NULL DEFAULT 'draft',
  `author_id` text NOT NULL REFERENCES `users`(`id`),
  `primary_image_r2_key` text,
  `meta_title` text,
  `meta_description` text,
  `og_image_r2_key` text,
  `schema_markup` text,
  `reading_time_minutes` integer,
  `word_count` integer,
  `featured` integer DEFAULT 0,
  `allow_comments` integer DEFAULT 1,
  `canonical_url` text,
  `visibility` text NOT NULL DEFAULT 'public',
  `published_at` text,
  `scheduled_at` text,
  `revision_count` integer DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);
CREATE INDEX `idx_posts_status` ON `posts` (`status`);
CREATE INDEX `idx_posts_author` ON `posts` (`author_id`);
CREATE INDEX `idx_posts_published` ON `posts` (`published_at`);
CREATE INDEX `idx_posts_slug` ON `posts` (`slug`);

CREATE TABLE IF NOT EXISTS `post_revisions` (
  `id` text PRIMARY KEY NOT NULL,
  `post_id` text NOT NULL REFERENCES `posts`(`id`) ON DELETE CASCADE,
  `content_html` text,
  `content_markdown` text,
  `changed_by` text REFERENCES `users`(`id`),
  `revision_note` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX `idx_revisions_post` ON `post_revisions` (`post_id`);

CREATE TABLE IF NOT EXISTS `tags` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text,
  `cover_image_r2_key` text,
  `meta_title` text,
  `meta_description` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);

CREATE TABLE IF NOT EXISTS `post_tags` (
  `post_id` text NOT NULL REFERENCES `posts`(`id`) ON DELETE CASCADE,
  `tag_id` text NOT NULL REFERENCES `tags`(`id`) ON DELETE CASCADE,
  PRIMARY KEY (`post_id`, `tag_id`)
);

CREATE TABLE IF NOT EXISTS `series` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `slug` text NOT NULL,
  `description` text,
  `cover_image_r2_key` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX `series_slug_unique` ON `series` (`slug`);

CREATE TABLE IF NOT EXISTS `post_series` (
  `post_id` text NOT NULL REFERENCES `posts`(`id`) ON DELETE CASCADE,
  `series_id` text NOT NULL REFERENCES `series`(`id`) ON DELETE CASCADE,
  `order_index` integer NOT NULL DEFAULT 0,
  PRIMARY KEY (`post_id`, `series_id`)
);

CREATE TABLE IF NOT EXISTS `comments` (
  `id` text PRIMARY KEY NOT NULL,
  `post_id` text NOT NULL REFERENCES `posts`(`id`) ON DELETE CASCADE,
  `parent_id` text,
  `author_id` text REFERENCES `users`(`id`),
  `guest_name` text,
  `guest_email` text,
  `body_html` text NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `ip_hash` text,
  `upvotes` integer DEFAULT 0,
  `edited_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX `idx_comments_post` ON `comments` (`post_id`);
CREATE INDEX `idx_comments_status` ON `comments` (`status`);

CREATE TABLE IF NOT EXISTS `comment_reactions` (
  `comment_id` text NOT NULL REFERENCES `comments`(`id`) ON DELETE CASCADE,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `reaction` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (`comment_id`, `user_id`)
);

CREATE TABLE IF NOT EXISTS `media` (
  `id` text PRIMARY KEY NOT NULL,
  `r2_key` text NOT NULL,
  `original_filename` text NOT NULL,
  `mime_type` text NOT NULL,
  `file_size_bytes` integer NOT NULL,
  `width` integer,
  `height` integer,
  `blurhash` text,
  `alt_text` text,
  `caption` text,
  `folder_path` text DEFAULT '/',
  `uploaded_by` text REFERENCES `users`(`id`),
  `is_deleted` integer DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX `media_r2_key_unique` ON `media` (`r2_key`);
CREATE INDEX `idx_media_folder` ON `media` (`folder_path`);
CREATE INDEX `idx_media_uploaded_by` ON `media` (`uploaded_by`);

CREATE TABLE IF NOT EXISTS `media_variants` (
  `id` text PRIMARY KEY NOT NULL,
  `media_id` text NOT NULL REFERENCES `media`(`id`) ON DELETE CASCADE,
  `r2_key` text NOT NULL,
  `variant_name` text NOT NULL,
  `width` integer,
  `height` integer,
  `file_size_bytes` integer
);
CREATE INDEX `idx_variants_media` ON `media_variants` (`media_id`);

CREATE TABLE IF NOT EXISTS `newsletters` (
  `id` text PRIMARY KEY NOT NULL,
  `subject` text NOT NULL,
  `preview_text` text,
  `content_html` text,
  `status` text NOT NULL DEFAULT 'draft',
  `scheduled_at` text,
  `sent_at` text,
  `recipient_count` integer DEFAULT 0,
  `open_count` integer DEFAULT 0,
  `click_count` integer DEFAULT 0,
  `bounce_count` integer DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `name` text,
  `subscribed_at` text NOT NULL DEFAULT (datetime('now')),
  `confirmed_at` text,
  `unsubscribed_at` text,
  `source` text,
  `tags` text,
  `cf_geo_country` text
);
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);

CREATE TABLE IF NOT EXISTS `newsletter_sends` (
  `newsletter_id` text NOT NULL REFERENCES `newsletters`(`id`) ON DELETE CASCADE,
  `subscriber_id` text NOT NULL REFERENCES `newsletter_subscribers`(`id`),
  `sent_at` text,
  `opened_at` text,
  `clicked_at` text,
  `bounced_at` text,
  PRIMARY KEY (`newsletter_id`, `subscriber_id`)
);

CREATE TABLE IF NOT EXISTS `memberships` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `tier` text NOT NULL,
  `status` text NOT NULL DEFAULT 'active',
  `stripe_subscription_id` text,
  `started_at` text NOT NULL DEFAULT (datetime('now')),
  `expires_at` text,
  `price_paid` integer,
  `currency` text DEFAULT 'usd'
);
CREATE INDEX `idx_memberships_user` ON `memberships` (`user_id`);

CREATE TABLE IF NOT EXISTS `forms` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `fields_schema` text,
  `notifications` text,
  `success_message` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `form_submissions` (
  `id` text PRIMARY KEY NOT NULL,
  `form_id` text NOT NULL REFERENCES `forms`(`id`) ON DELETE CASCADE,
  `data` text,
  `submitter_ip_hash` text,
  `submitter_country` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text,
  `updated_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_by` text REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `name` text NOT NULL,
  `key_hash` text NOT NULL,
  `scopes` text,
  `last_used_at` text,
  `expires_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `redirects` (
  `source_path` text PRIMARY KEY NOT NULL,
  `destination_url` text NOT NULL,
  `status_code` integer NOT NULL DEFAULT 301,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `url` text NOT NULL,
  `events` text,
  `secret` text NOT NULL,
  `active` integer DEFAULT 1,
  `last_triggered_at` text,
  `failure_count` integer DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text REFERENCES `users`(`id`),
  `action` text NOT NULL,
  `resource_type` text,
  `resource_id` text,
  `diff_json` text,
  `ip_hash` text,
  `user_agent` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX `idx_audit_user` ON `audit_log` (`user_id`);
CREATE INDEX `idx_audit_resource` ON `audit_log` (`resource_type`, `resource_id`);
CREATE INDEX `idx_audit_created` ON `audit_log` (`created_at`);

CREATE TABLE IF NOT EXISTS `post_analytics_daily` (
  `post_id` text NOT NULL REFERENCES `posts`(`id`) ON DELETE CASCADE,
  `date` text NOT NULL,
  `views` integer DEFAULT 0,
  `unique_visitors` integer DEFAULT 0,
  `avg_read_time_seconds` integer DEFAULT 0,
  `scroll_depth_avg` real DEFAULT 0,
  PRIMARY KEY (`post_id`, `date`)
);

CREATE TABLE IF NOT EXISTS `site_analytics_daily` (
  `date` text PRIMARY KEY NOT NULL,
  `total_views` integer DEFAULT 0,
  `unique_visitors` integer DEFAULT 0,
  `top_posts_json` text,
  `top_referrers_json` text,
  `country_breakdown_json` text
);
