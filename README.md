# CloudEdge CMS

A production-grade blog platform running 100% on Cloudflare's edge infrastructure — zero external servers, zero traditional databases, zero third-party storage.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Cloudflare Network                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────────────┐    │
│  │  Pages   │   │    Worker    │   │    Durable Objects       │    │
│  │(Frontend)│──▶│  (Hono API)  │──▶│ • PostCollaboration(WS)  │    │
│  │  (Admin) │   │              │   │ • LiveComments(WS)       │    │
│  └──────────┘   └──────┬───────┘   │ • Analytics(buffer)      │    │
│                         │           │ • BuildQueue(newsletter)  │    │
│                         ▼           └──────────────────────────┘    │
│         ┌───────────────────────────────┐                           │
│         │          Bindings             │                           │
│         ├───────────┬───────┬───────────┤                           │
│         │    D1     │  KV   │    R2     │                           │
│         │ (SQLite)  │(Cache)│ (Storage) │                           │
│         └───────────┴───────┴───────────┘                           │
│                         │                                           │
│         ┌───────────────┼───────────────┐                           │
│         │               │               │                           │
│    ┌────▼────┐   ┌─────▼──────┐  ┌────▼──────┐                    │
│    │Vectorize│   │   Queues    │  │Workers AI │                    │
│    │(Search) │   │(img/email)  │  │(LLM/Embed)│                    │
│    └─────────┘   └────────────┘  └───────────┘                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Service | Purpose |
|-------|---------|---------|
| Runtime | Workers + Hono.js | API server, routing, middleware |
| Frontend | Cloudflare Pages + React 18 | Public blog + Admin SPA |
| Database | D1 (SQLite) + Drizzle ORM | Structured data, 22+ tables |
| Storage | R2 | Images, media, backups, exports |
| Cache | KV (7 namespaces) | Sessions, rendered HTML, rate limits |
| Real-time | Durable Objects (4 classes) | Collab editing, live comments, analytics |
| AI | Workers AI + Vectorize | Content AI, semantic search |
| Queues | Cloudflare Queues (2) | Image processing, email sending |
| Email | Resend API (via Queue worker) | Transactional + newsletter |
| Payments | Stripe (webhooks) | Membership/subscriptions |

## Project Structure

```
cloudedge-cms/
├── apps/
│   ├── worker/          # Hono.js API Worker
│   ├── admin/           # React admin SPA (Vite + Tailwind)
│   └── frontend/        # Public blog SPA (Vite + Tailwind)
├── packages/
│   ├── db/              # Drizzle schema, migrations, seed
│   ├── shared/          # Types, cache utilities, env bindings
│   └── email/           # HTML email templates
├── workers/
│   ├── image-processor/ # Queue consumer: image variants
│   └── email-sender/    # Queue consumer: Resend API
├── wrangler.toml        # All CF bindings configuration
├── turbo.json           # Turborepo pipeline
└── pnpm-workspace.yaml  # Monorepo workspace
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Wrangler CLI (`npm i -g wrangler`)
- Cloudflare account with Workers Paid plan

### Local Development

```bash
# Clone and install
git clone <repo-url> cloudedge-cms
cd cloudedge-cms
pnpm install

# Create local D1 database
wrangler d1 create cloudedge-cms-db-dev
# Update wrangler.toml [env.dev] with the database_id

# Run migrations locally
wrangler d1 execute cloudedge-cms-db-dev --local --file=packages/db/migrations/0000_init.sql

# Seed demo data
pnpm db:seed | wrangler d1 execute cloudedge-cms-db-dev --local --command=-

# Start development
pnpm dev
# Worker API: http://localhost:8787
# Frontend:   http://localhost:3000
# Admin:      http://localhost:3001
```

### Environment Variables (Secrets)

Set via `wrangler secret put <NAME>`:

| Secret | Description |
|--------|-------------|
| `JWT_SECRET` | Random 32+ char string for JWT signing |
| `RESEND_API_KEY` | Resend.com API key for transactional email |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret |
| `R2_ACCESS_KEY_ID` | R2 S3-compatible API access key |
| `R2_SECRET_ACCESS_KEY` | R2 S3-compatible API secret key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile for form protection |

### Create Required Resources

```bash
# KV Namespaces
wrangler kv namespace create SESSIONS
wrangler kv namespace create CACHE_RENDERED
wrangler kv namespace create RATE_LIMITS
wrangler kv namespace create FEATURE_FLAGS
wrangler kv namespace create SITE_CONFIG
wrangler kv namespace create EMAIL_QUEUE_DEDUP
wrangler kv namespace create SEARCH_CACHE

# R2 Buckets
wrangler r2 bucket create cloudedge-media-uploads
wrangler r2 bucket create cloudedge-media-processed
wrangler r2 bucket create cloudedge-site-backups
wrangler r2 bucket create cloudedge-newsletter-archives
wrangler r2 bucket create cloudedge-import-export

# Queues
wrangler queues create cloudedge-image-processing
wrangler queues create cloudedge-email-sending

# Vectorize Index
wrangler vectorize create cloudedge-posts --dimensions=768 --metric=cosine

# D1 Database
wrangler d1 create cloudedge-cms-db
```

Update `wrangler.toml` with the IDs from these commands.

### Deployment

```bash
# Deploy to production (runs migrations + deploys worker + pages)
pnpm deploy:production

# Or deploy individually:
wrangler d1 migrations apply cloudedge-cms-db --remote
wrangler deploy                                    # Worker
wrangler pages deploy apps/frontend/dist --project-name=cloudedge-frontend
wrangler pages deploy apps/admin/dist --project-name=cloudedge-admin
```

## API Endpoints

### Public
- `GET /api/v1/posts` — List published posts (paginated)
- `GET /api/v1/posts/:slug` — Get single post
- `GET /api/v1/tags` — List all tags
- `GET /api/v1/comments?postId=xxx` — Get approved comments
- `POST /api/v1/comments` — Submit comment
- `POST /api/v1/newsletter/subscribe` — Subscribe to newsletter
- `GET /rss.xml` — RSS 2.0 feed
- `GET /feed.json` — JSON Feed 1.1
- `GET /sitemap.xml` — XML Sitemap

### Auth
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Email + password login
- `POST /api/v1/auth/magic-link` — Send magic link
- `GET /api/v1/auth/me` — Get current user

### Admin (requires auth)
- `POST /api/v1/posts` — Create post
- `PUT /api/v1/posts/:id` — Update post
- `DELETE /api/v1/posts/:id` — Delete post
- `POST /api/v1/media/upload-url` — Get presigned upload URL
- `POST /api/v1/media/confirm` — Confirm upload
- `GET /api/v1/admin/dashboard` — Dashboard stats
- `PUT /api/v1/admin/settings` — Update settings

### AI
- `POST /api/v1/ai/improve` — Improve writing
- `POST /api/v1/ai/excerpt` — Generate excerpt
- `POST /api/v1/ai/suggest-tags` — AI tag suggestions
- `POST /api/v1/ai/search` — Semantic search via Vectorize
- `POST /api/v1/ai/alt-text` — Generate image alt text

## Key Design Decisions

1. **PBKDF2 over bcrypt** — `crypto.subtle` is native in Workers; bcrypt requires WASM.
2. **Resend over MailChannels** — MailChannels free tier with CF Workers ended Aug 2024.
3. **WebSocket Hibernation API** — Durable Objects use hibernation for cost efficiency with persistent connections.
4. **KV sliding window rate limiting** — Lightweight, distributed, no external dependencies.
5. **Analytics DO buffering** — Prevents D1 write storms by batching page views every 60s.
6. **R2 presigned uploads** — Client uploads directly to R2, bypassing Worker memory/CPU limits.
7. **Drizzle ORM** — Type-safe D1 queries with proper migration management.
8. **Inline email styles** — MJML requires Node.js DOM; hand-coded responsive HTML works in Workers.

## Cloudflare Service Limits (as of 2025)

| Service | Free Tier | Paid |
|---------|-----------|------|
| Workers | 100k req/day | 10M req/mo included |
| D1 | 5M reads/day, 100k writes/day | 25B reads, 50M writes |
| KV | 100k reads/day | Unlimited |
| R2 | 10GB storage, 10M Class A | 1M Class A free |
| Durable Objects | — | $0.15/million requests |
| Queues | — | 1M messages free |
| Vectorize | 5 indexes, 200k vectors | Scale plan available |
| Workers AI | 10k neurons/day free | Pay as you go |

## License

MIT
