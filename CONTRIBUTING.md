# Contributing to CloudEdge CMS

## Getting Started

1. Fork the repo and clone locally
2. Copy `wrangler.toml.example` to `wrangler.toml` and fill in your Cloudflare resource IDs
3. `pnpm install`
4. Create local D1: `wrangler d1 create cloudedge-cms-db-dev`
5. Run migrations: `wrangler d1 execute cloudedge-cms-db-dev --local --file=packages/db/migrations/0000_init.sql`
6. `pnpm dev`

## Branch Naming

- `feat/description` — new features
- `fix/description` — bug fixes
- `chore/description` — maintenance

## Pull Requests

- Keep PRs focused on a single concern
- Ensure `pnpm build` passes before submitting
- Add tests for new API endpoints
