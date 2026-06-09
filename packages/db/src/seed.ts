// Seed script for CloudEdge CMS demo data
// Run: pnpm db:seed (uses wrangler d1 execute under the hood)
// This generates SQL statements to populate the local D1 database.

const uuid = () => crypto.randomUUID();

const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().replace('T', ' ').slice(0, 19);

// ─── IDs ───
const ownerId = uuid();
const editorId = uuid();
const authorId = uuid();
const subscriberId = uuid();

const tagIds = { tech: uuid(), design: uuid(), devops: uuid(), ai: uuid(), tutorial: uuid() };
const seriesId = uuid();
const postIds = Array.from({ length: 6 }, () => uuid());
const newsletterId = uuid();
const formId = uuid();

function esc(s: string) { return s.replace(/'/g, "''"); }

const sql = `
-- CloudEdge CMS Seed Data
PRAGMA foreign_keys = ON;

-- Users
INSERT INTO users (id, email, name, password_hash, role, bio, social_links, created_at) VALUES
('${ownerId}', 'admin@cloudedge.dev', 'Alex Rivera', 'TRQEdZUXuXhFAdoz60W80w==:34fmkQsTJ6+R97jWa/g/8I6JQtZ6RDWSph4kf1zkMhI=', 'owner', 'Founder of CloudEdge CMS. Building the future of edge-native publishing.', '${esc(JSON.stringify({ twitter: "@alexrivera", github: "alexrivera" }))}', '${daysAgo(90)}'),
('${editorId}', 'editor@cloudedge.dev', 'Sam Chen', 'TRQEdZUXuXhFAdoz60W80w==:34fmkQsTJ6+R97jWa/g/8I6JQtZ6RDWSph4kf1zkMhI=', 'editor', 'Senior editor, loves long-form content about edge computing.', '${esc(JSON.stringify({ twitter: "@samchen" }))}', '${daysAgo(60)}'),
('${authorId}', 'author@cloudedge.dev', 'Jordan Lee', 'TRQEdZUXuXhFAdoz60W80w==:34fmkQsTJ6+R97jWa/g/8I6JQtZ6RDWSph4kf1zkMhI=', 'author', 'Technical writer specializing in serverless architecture.', '${esc(JSON.stringify({ github: "jordanlee" }))}', '${daysAgo(45)}'),
('${subscriberId}', 'reader@example.com', 'Pat Morgan', NULL, 'subscriber', NULL, NULL, '${daysAgo(10)}');

-- Tags
INSERT INTO tags (id, name, slug, description, created_at) VALUES
('${tagIds.tech}', 'Technology', 'technology', 'Posts about web technologies and platforms', '${daysAgo(90)}'),
('${tagIds.design}', 'Design', 'design', 'UI/UX design principles and patterns', '${daysAgo(90)}'),
('${tagIds.devops}', 'DevOps', 'devops', 'CI/CD, infrastructure, and deployment', '${daysAgo(90)}'),
('${tagIds.ai}', 'Artificial Intelligence', 'ai', 'AI, ML, and LLM topics', '${daysAgo(90)}'),
('${tagIds.tutorial}', 'Tutorial', 'tutorial', 'Step-by-step guides and walkthroughs', '${daysAgo(90)}');

-- Series
INSERT INTO series (id, title, slug, description, created_at) VALUES
('${seriesId}', 'Edge Computing Deep Dive', 'edge-computing-deep-dive', 'A comprehensive series exploring Cloudflare edge platform capabilities.', '${daysAgo(60)}');

-- Posts
INSERT INTO posts (id, title, slug, content_html, content_markdown, excerpt, status, author_id, reading_time_minutes, word_count, featured, allow_comments, visibility, published_at, created_at, updated_at) VALUES
('${postIds[0]}', 'Getting Started with Cloudflare Workers', 'getting-started-cloudflare-workers', '<h2>Introduction</h2><p>Cloudflare Workers lets you run JavaScript at the edge, closer to your users than ever before.</p><h2>Your First Worker</h2><p>Let''s build a simple API endpoint that responds with JSON.</p><pre><code>export default { async fetch(request) { return Response.json({ hello: "world" }); } };</code></pre><h2>Deployment</h2><p>Deploy with a single command: <code>wrangler deploy</code></p>', '## Introduction\n\nCloudflare Workers lets you run JavaScript at the edge, closer to your users than ever before.\n\n## Your First Worker\n\nLet''s build a simple API endpoint that responds with JSON.\n\n\`\`\`js\nexport default {\n  async fetch(request) {\n    return Response.json({ hello: "world" });\n  }\n};\n\`\`\`\n\n## Deployment\n\nDeploy with a single command: \`wrangler deploy\`', 'Learn how to build and deploy your first Cloudflare Worker in under 5 minutes.', 'published', '${ownerId}', 4, 850, 1, 1, 'public', '${daysAgo(30)}', '${daysAgo(32)}', '${daysAgo(30)}'),
('${postIds[1]}', 'D1 Database: SQLite at the Edge', 'd1-database-sqlite-edge', '<h2>What is D1?</h2><p>D1 is Cloudflare''s native serverless SQL database built on SQLite.</p><h2>Schema Design</h2><p>Design your schema with foreign keys, indexes, and proper normalization.</p>', '## What is D1?\n\nD1 is Cloudflare''s native serverless SQL database built on SQLite.\n\n## Schema Design\n\nDesign your schema with foreign keys, indexes, and proper normalization.', 'Explore Cloudflare D1, the first globally distributed SQLite database.', 'published', '${ownerId}', 6, 1200, 0, 1, 'public', '${daysAgo(25)}', '${daysAgo(27)}', '${daysAgo(25)}'),
('${postIds[2]}', 'Building Real-time Features with Durable Objects', 'realtime-durable-objects', '<h2>Why Durable Objects?</h2><p>When you need consistent state at the edge, Durable Objects are the answer.</p>', '## Why Durable Objects?\n\nWhen you need consistent state at the edge, Durable Objects are the answer.', 'Build multiplayer experiences and real-time collaboration with Cloudflare Durable Objects.', 'published', '${editorId}', 8, 1600, 1, 1, 'public', '${daysAgo(20)}', '${daysAgo(22)}', '${daysAgo(20)}'),
('${postIds[3]}', 'AI at the Edge: Workers AI Deep Dive', 'ai-edge-workers-ai', '<h2>Workers AI Models</h2><p>Run inference without leaving Cloudflare''s network.</p>', '## Workers AI Models\n\nRun inference without leaving Cloudflare''s network.', 'Run LLMs, image models, and embeddings directly on Cloudflare''s infrastructure.', 'published', '${authorId}', 5, 1000, 0, 1, 'members', '${daysAgo(15)}', '${daysAgo(17)}', '${daysAgo(15)}'),
('${postIds[4]}', 'Vectorize: Semantic Search Made Simple', 'vectorize-semantic-search', '<h2>Vector Databases</h2><p>Vectorize brings ANN search to the edge.</p>', '## Vector Databases\n\nVectorize brings ANN search to the edge.', 'Add semantic search to your application with Cloudflare Vectorize.', 'draft', '${authorId}', 7, 1400, 0, 1, 'public', NULL, '${daysAgo(5)}', '${daysAgo(3)}'),
('${postIds[5]}', 'The Future of Edge Computing (2025)', 'future-edge-computing-2025', '<h2>Trends</h2><p>Edge computing is reshaping how we build applications.</p>', '## Trends\n\nEdge computing is reshaping how we build applications.', 'Predictions and trends for edge computing in 2025 and beyond.', 'scheduled', '${ownerId}', 10, 2000, 1, 1, 'public', NULL, '${daysAgo(2)}', '${daysAgo(1)}');

-- Post Tags
INSERT INTO post_tags (post_id, tag_id) VALUES
('${postIds[0]}', '${tagIds.tech}'), ('${postIds[0]}', '${tagIds.tutorial}'),
('${postIds[1]}', '${tagIds.tech}'), ('${postIds[1]}', '${tagIds.devops}'),
('${postIds[2]}', '${tagIds.tech}'), ('${postIds[2]}', '${tagIds.tutorial}'),
('${postIds[3]}', '${tagIds.ai}'), ('${postIds[3]}', '${tagIds.tech}'),
('${postIds[4]}', '${tagIds.ai}'), ('${postIds[4]}', '${tagIds.tutorial}'),
('${postIds[5]}', '${tagIds.tech}');

-- Post Series
INSERT INTO post_series (post_id, series_id, order_index) VALUES
('${postIds[0]}', '${seriesId}', 1),
('${postIds[1]}', '${seriesId}', 2),
('${postIds[2]}', '${seriesId}', 3);

-- Comments
INSERT INTO comments (id, post_id, parent_id, author_id, guest_name, guest_email, body_html, status, upvotes, created_at) VALUES
('${uuid()}', '${postIds[0]}', NULL, '${subscriberId}', NULL, NULL, '<p>Great introduction! The code example is really clear.</p>', 'approved', 3, '${daysAgo(28)}'),
('${uuid()}', '${postIds[0]}', NULL, NULL, 'DevFan42', 'dev@example.com', '<p>How does this compare to AWS Lambda@Edge?</p>', 'approved', 1, '${daysAgo(27)}'),
('${uuid()}', '${postIds[2]}', NULL, '${editorId}', NULL, NULL, '<p>Durable Objects changed how I think about state management.</p>', 'approved', 5, '${daysAgo(18)}'),
('${uuid()}', '${postIds[3]}', NULL, NULL, 'AIEnthusiast', 'ai@example.com', '<p>Can you do fine-tuning on Workers AI?</p>', 'pending', 0, '${daysAgo(12)}');

-- Newsletter Subscribers
INSERT INTO newsletter_subscribers (id, email, name, subscribed_at, confirmed_at, source, tags, cf_geo_country) VALUES
('${uuid()}', 'reader@example.com', 'Pat Morgan', '${daysAgo(10)}', '${daysAgo(10)}', 'website', '["general"]', 'US'),
('${uuid()}', 'dev@example.com', 'DevFan42', '${daysAgo(27)}', '${daysAgo(27)}', 'comment', '["general","tech"]', 'GB'),
('${uuid()}', 'newsletter@example.com', 'Newsletter Reader', '${daysAgo(5)}', '${daysAgo(5)}', 'import', '["general"]', 'DE'),
('${uuid()}', 'unconfirmed@example.com', 'Pending User', '${daysAgo(2)}', NULL, 'website', '["general"]', 'FR');

-- Newsletter
INSERT INTO newsletters (id, subject, preview_text, content_html, status, sent_at, recipient_count, open_count, click_count, created_at) VALUES
('${newsletterId}', 'This Week on CloudEdge: Workers AI Deep Dive', 'New post about running AI models at the edge', '<h1>This Week on CloudEdge</h1><p>We published a new deep dive into Workers AI...</p>', 'sent', '${daysAgo(14)}', 3, 2, 1, '${daysAgo(15)}');

-- Memberships
INSERT INTO memberships (id, user_id, tier, status, started_at) VALUES
('${uuid()}', '${subscriberId}', 'free', 'active', '${daysAgo(10)}');

-- Forms
INSERT INTO forms (id, title, fields_schema, success_message, created_at) VALUES
('${formId}', 'Contact Form', '${esc(JSON.stringify([{ name: "name", type: "text", required: true }, { name: "email", type: "email", required: true }, { name: "message", type: "textarea", required: true }]))}', 'Thanks for reaching out! We will respond within 24 hours.', '${daysAgo(60)}');

-- Settings
INSERT INTO settings (key, value, updated_at, updated_by) VALUES
('site_title', '"CloudEdge Blog"', '${daysAgo(90)}', '${ownerId}'),
('site_description', '"A modern blog powered by Cloudflare edge infrastructure"', '${daysAgo(90)}', '${ownerId}'),
('posts_per_page', '10', '${daysAgo(90)}', '${ownerId}'),
('allow_registration', 'true', '${daysAgo(90)}', '${ownerId}'),
('comment_moderation', '"manual"', '${daysAgo(90)}', '${ownerId}'),
('theme', '"minimal"', '${daysAgo(30)}', '${ownerId}'),
('navigation', '${esc(JSON.stringify([{ label: "Home", url: "/" }, { label: "About", url: "/about" }, { label: "Archive", url: "/archive" }, { label: "Newsletter", url: "/newsletter" }]))}', '${daysAgo(60)}', '${ownerId}');

-- Redirects
INSERT INTO redirects (source_path, destination_url, status_code, created_at) VALUES
('/wp-admin', '/admin', 301, '${daysAgo(60)}'),
('/feed', '/rss.xml', 301, '${daysAgo(60)}');

-- Post Analytics
INSERT INTO post_analytics_daily (post_id, date, views, unique_visitors, avg_read_time_seconds, scroll_depth_avg) VALUES
('${postIds[0]}', '${daysAgo(1).slice(0, 10)}', 142, 98, 185, 0.72),
('${postIds[0]}', '${daysAgo(2).slice(0, 10)}', 203, 156, 192, 0.68),
('${postIds[1]}', '${daysAgo(1).slice(0, 10)}', 87, 65, 210, 0.81),
('${postIds[2]}', '${daysAgo(1).slice(0, 10)}', 256, 189, 240, 0.85),
('${postIds[3]}', '${daysAgo(1).slice(0, 10)}', 64, 52, 165, 0.60);

-- Site Analytics
INSERT INTO site_analytics_daily (date, total_views, unique_visitors, top_posts_json, top_referrers_json, country_breakdown_json) VALUES
('${daysAgo(1).slice(0, 10)}', 549, 404, '${esc(JSON.stringify([{ id: postIds[2], views: 256 }, { id: postIds[0], views: 142 }]))}', '${esc(JSON.stringify([{ source: "twitter.com", visits: 120 }, { source: "google.com", visits: 98 }]))}', '${esc(JSON.stringify({ US: 180, GB: 65, DE: 42, IN: 38 }))}'),
('${daysAgo(2).slice(0, 10)}', 612, 445, '${esc(JSON.stringify([{ id: postIds[0], views: 203 }, { id: postIds[2], views: 178 }]))}', '${esc(JSON.stringify([{ source: "google.com", visits: 145 }, { source: "hackernews", visits: 89 }]))}', '${esc(JSON.stringify({ US: 200, GB: 72, DE: 55, IN: 40 }))}');

-- Audit Log
INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, created_at) VALUES
('${uuid()}', '${ownerId}', 'create', 'post', '${postIds[0]}', '${daysAgo(32)}'),
('${uuid()}', '${ownerId}', 'publish', 'post', '${postIds[0]}', '${daysAgo(30)}'),
('${uuid()}', '${ownerId}', 'create', 'post', '${postIds[1]}', '${daysAgo(27)}'),
('${uuid()}', '${editorId}', 'create', 'post', '${postIds[2]}', '${daysAgo(22)}'),
('${uuid()}', '${ownerId}', 'update', 'settings', 'theme', '${daysAgo(30)}');
`;

// Output for wrangler d1 execute or direct import
console.log(sql);
