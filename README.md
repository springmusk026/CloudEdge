# CloudEdge CMS

A self-hosted blog and content management system built entirely on Cloudflare's edge platform. No external servers, no traditional databases, no third-party storage.

## Stack

| Layer | Technology | Role |
|-------|-----------|------|
| API | Cloudflare Workers, Hono.js | Request handling, routing |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui | Public blog and admin panel |
| Database | Cloudflare D1, Drizzle ORM | Relational data (22 tables) |
| Storage | Cloudflare R2 | Images, media, backups |
| Cache | Cloudflare KV | Sessions, rendered pages, rate limits |
| Real-time | Durable Objects | Collaborative editing, live comments |
| Search | Vectorize | Semantic similarity search |
| AI | Workers AI | Writing tools, embeddings, moderation |
| Queues | Cloudflare Queues | Image processing, email delivery |
| Email | Resend | Transactional and newsletter emails |
| Payments | Stripe | Memberships and subscriptions |

## Project Structure

```
├── apps/
│   ├── worker/          Hono.js API (Workers)
│   ├── admin/           Admin panel (React + shadcn/ui + Tiptap)
│   └── frontend/        Public blog (React + Framer Motion)
├── packages/
│   ├── db/              Schema, migrations, seed
│   ├── shared/          Types, cache utilities
│   └── email/           Email templates
├── workers/
│   ├── image-processor/ Queue consumer
│   └── email-sender/    Queue consumer
├── wrangler.toml.example
└── turbo.json
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Wrangler CLI
- Cloudflare account (Workers Paid plan)

## Setup

```bash
git clone https://github.com/springmusk026/CloudEdge.git
cd CloudEdge
cp wrangler.toml.example wrangler.toml
pnpm install
```

Create a D1 database and update `wrangler.toml` with the ID:

```bash
wrangler d1 create cloudedge-cms-db-dev
```

Run migrations and seed:

```bash
wrangler d1 execute cloudedge-cms-db-dev --local --file=packages/db/migrations/0000_init.sql
```

Start development servers:

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:8787 |
| Frontend | http://localhost:3000 |
| Admin | http://localhost:3001 |

## Configuration

Copy `wrangler.toml.example` to `wrangler.toml` and fill in resource IDs. Secrets are set via `wrangler secret put`:

| Secret | Required for |
|--------|-------------|
| `JWT_SECRET` | Auth token signing |
| `RESEND_API_KEY` | Email delivery |
| `STRIPE_SECRET_KEY` | Payments |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `TURNSTILE_SECRET_KEY` | Bot protection |

## Deployment

```bash
# Apply migrations to production D1
wrangler d1 migrations apply cloudedge-cms-db --remote

# Deploy worker
wrangler deploy

# Deploy frontend and admin (Cloudflare Pages)
wrangler pages deploy apps/frontend/dist --project-name=cloudedge-frontend
wrangler pages deploy apps/admin/dist --project-name=cloudedge-admin
```

CI/CD is configured in `.github/workflows/ci-cd.yml` — pushes to `main` auto-deploy.

## API Overview

All endpoints are under `/api/v1/`. Authentication uses Bearer tokens.

**Public:** `GET /posts`, `GET /posts/:slug`, `GET /tags`, `GET /comments?postId=`, `POST /comments`, `POST /newsletter/subscribe`

**Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/magic-link`, `GET /auth/me`

**Admin:** Full CRUD for posts, tags, media, users, settings, newsletter campaigns, comments moderation.

**AI:** `/ai/improve`, `/ai/excerpt`, `/ai/suggest-tags`, `/ai/search`, `/ai/alt-text`

**Feeds:** `/rss.xml`, `/feed.json`, `/sitemap.xml`

## Architecture Decisions

- **PBKDF2 for passwords** — `crypto.subtle` is native in Workers; bcrypt requires WASM.
- **Resend for email** — MailChannels discontinued free Workers integration (Aug 2024).
- **Durable Objects with Hibernation** — WebSocket connections stay open without billing for idle time.
- **KV rate limiting** — Sliding window counters, no external dependencies.
- **Analytics buffering** — DO collects page views in memory, flushes to D1 every 60s to avoid write storms.
- **R2 presigned uploads** — Clients upload directly to R2, bypassing Worker memory limits.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

Free for non-commercial use with attribution. Commercial use requires a license. See [LICENSE](LICENSE).
