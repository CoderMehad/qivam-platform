# OpenIslam Platform

Masjid directory and prayer times API — SST v2 monorepo.

## Tech Stack

- **Infrastructure**: SST v2 (CDK-based), deployed to AWS `eu-west-1`
- **API**: Hono (runs in a single Lambda function behind API Gateway)
- **Database**: RDS PostgreSQL 15.5 with PostGIS, managed via Drizzle ORM
- **Driver**: porsager's `postgres` (TCP over VPC private network)
- **Validation**: Zod + `@hono/zod-openapi` for OpenAPI spec generation
- **Auth**: JWT (jose) for admin, vetted API keys for developers
- **Storage**: S3 for mosque media (logos/covers)
- **Package manager**: pnpm (workspaces monorepo)

## Project Structure

```
sst.config.ts                ← SST v2 app config (wires stacks)
stacks/
  Database.ts                ← RDS PostgreSQL + VPC + PostGIS
  Storage.ts                 ← S3 bucket for media
  Api.ts                     ← API Gateway + Lambda (Hono)
  Web.ts                     ← Static site for landing page
packages/api/                ← Hono API (Lambda handler)
  drizzle.config.ts          ← Drizzle Kit config
  src/
    index.ts                 ← App entry + handler export
    routes/                  ← Route files (one per resource)
    middleware/              ← Auth, rate limiting, cache headers
    db/                      ← Drizzle schema, client, migrations
    lib/                     ← Prayer calculation, geo helpers
    schemas/                 ← Zod schemas (validation + OpenAPI)
packages/core/               ← Shared types between packages
  src/
    index.ts
```

## Commands

All commands run from this directory (`platform/`):

```bash
pnpm install               # Install all dependencies
npx sst dev                # Start SST dev mode (live Lambda)
npx sst deploy             # Deploy to AWS
npx sst remove             # Tear down all resources
pnpm typecheck             # Run TypeScript type checking
```

Drizzle migrations run from `packages/api/`:

```bash
cd packages/api
npx drizzle-kit generate   # Generate DB migrations
npx drizzle-kit migrate    # Apply migrations
```

## Coding Conventions

- ESM only (`"type": "module"` everywhere)
- Strict TypeScript — no `any`, no `@ts-ignore`
- Named exports only (no default exports except config files like `sst.config.ts`)
- Use Zod for all input validation — never trust raw input
- Drizzle ORM for all database queries — no raw SQL unless necessary

## Prayer Calculation

The adhan prayer calculation library will be built custom — do NOT install `adhan` from npm. The custom implementation will live in `packages/api/src/lib/`.

## Security Priorities

- No end-user personal data stored
- Search coordinates processed in-memory only — never persisted
- API keys are vetted (manual review before approval)
- All list endpoints: max 20 results, cursor-based pagination
- Admin routes enforce mosque_id ownership
- Passwords hashed with bcrypt (cost factor 12)
