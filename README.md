# Muslim Heritage — muslimheritage.in

Rebuild of the Kerala Muslim Heritage Foundation site (Kerala Muslim History Conference proceedings):
Next.js 16 (App Router) on Cloudflare Workers via OpenNext, D1 + Drizzle, R2 media, and a small CMS at `/admin`.

* Legacy audit: [docs/AUDIT.md](docs/AUDIT.md)
* Migration results: [docs/MIGRATION_REPORT.md](docs/MIGRATION_REPORT.md)

## Structure

```
src/app/(public)/      public pages — legacy URLs kept: /innermore/:id, /innerindex/:id, /author/:id, /confindex/:id, …
src/app/admin/         login, CMS pages, server actions, /admin/api/media (list + upload)
src/app/uploads/       R2 media delivery at legacy paths, edge-cached
src/lib/db/            Drizzle schema (drizzle/ holds SQL migrations)
src/lib/queries/       read queries (public.ts, admin.ts)
src/lib/admin/         write services (articles, media), action wrapper
src/lib/auth/          PBKDF2 passwords, D1-backed sessions, login rate limiting
src/lib/content/       HTML sanitiser (used on every write), text helpers
scripts/migration/     crawl → extract → download media → import (local or remote)
tests/unit, tests/e2e  Vitest and Playwright
```

## Local development

```bash
npm ci
cp .dev.vars.example .dev.vars          # then fill it in:
npm run hash-password -- 'a long password'   # → ADMIN_PASSWORD_HASH
npm run db:migrate:local
npm run migrate:import                  # seeds local D1/R2 from migration/data + migration/media
npm run dev                             # http://localhost:3000, admin at /admin
```

`next dev` reads bindings from `wrangler.jsonc` and secrets from `.dev.vars` (not `.env`).
If `migration/media/` is missing, run `npm run migrate:media` first (downloads from the legacy site).

## Configuration

| Name | Where | Purpose |
|---|---|---|
| `DB`, `MEDIA` | `wrangler.jsonc` bindings | D1 `islam-heritage`, R2 `islam-heritage` |
| `SITE_URL` | `wrangler.jsonc` vars | Canonical origin (`https://muslimheritage.in`) |
| `ALLOW_INDEXING` | vars | `"true"` only on production; otherwise robots.txt disallows all and pages send `noindex` |
| `MEDIA_BASE_URL` | vars | Public R2 origin for direct CDN URLs; empty = served by `/uploads/...` |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` | `.dev.vars` locally; `wrangler secret put NAME` in production | Admin sign-in |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `R2_*` | `.env` (scripts only, never deployed) | Remote migration/import |

## Tests and checks

```bash
npm run typecheck && npm run lint && npm test
E2E_ADMIN_PASSWORD='…' npm run test:e2e     # starts `next dev` on :3100 against local D1/R2
```

## Deploying (not done yet — needs approval)

1. Token for deploys needs *Workers Scripts:Edit*, *D1:Edit*, *Account Settings:Read* (the current token only has D1 access).
2. Secrets: `npx wrangler secret put ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` / `SESSION_SECRET`.
3. `npm run db:migrate:remote`, then `npm run deploy` (or the manual **CI → deploy** workflow).
   The OpenNext bundle step needs Linux/macOS or Windows **Developer Mode** (it creates symlinks);
   `.github/workflows/ci.yml` builds on Linux.
4. Check the `*.workers.dev` URL, then add the custom domain and set `ALLOW_INDEXING` to `"true"`.

### Media CDN

Enable public access on the `islam-heritage` R2 bucket with a custom domain (e.g. `media.muslimheritage.in`;
`r2.dev` is rate-limited and meant for testing), then set `MEDIA_BASE_URL` to that origin. Pages then load
images straight from the CDN; `/uploads/...` keeps working for old links.

### Re-running the migration

```bash
npm run migrate:crawl && npm run migrate:extract && npm run migrate:media
npm run migrate:import               # local
npm run migrate:import:remote        # remote (reads .env); add -- --force to overwrite CMS edits
```

## Backup and restore

* D1: `npx wrangler d1 export DB --remote --output backups/d1-$(date +%F).sql`; restore into a fresh database with `npx wrangler d1 execute <db> --remote --file backups/…sql`. D1 Time Travel also allows `npx wrangler d1 time-travel restore DB --timestamp <ISO>` (last 30 days).
* R2: objects are immutable (new uploads get new keys). For an off-site copy, sync the bucket with any S3 tool using the R2 S3 keys.
* Code/config: git.

## Rollback

* Code: `npx wrangler rollback` (or redeploy the previous commit).
* Data: D1 Time Travel restore to a timestamp before the change.
* Launch: keep the legacy server running and DNS unchanged until the new site is verified; reverting DNS to it is the full rollback.

## Launch checklist

- [ ] Deploy token with Workers permissions; secrets set; `npm run db:migrate:remote`
- [ ] Deploy to `*.workers.dev` and click through every page type, admin login and an article edit
- [ ] Media custom domain + `MEDIA_BASE_URL` (optional but recommended)
- [ ] Spot-check 20 migrated articles against the legacy site; fix `/innermore/7` author if known
- [ ] Add alt text to key images in Admin → Media
- [ ] Custom domain `muslimheritage.in` (www 301s to apex) → Worker; `ALLOW_INDEXING = "true"`; submit `/sitemap.xml` to Search Console
- [ ] Take a D1 export right after launch
