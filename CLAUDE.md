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
sst.config.ts                ← SST v2 app config (wires single stack)
stacks/
  MainStack.ts               ← Single stack: Api + Bucket (RDS added later)
packages/core/               ← Pure domain layer (NO Hono, NO HTTP)
  src/
    domain.ts                ← Types: Mosque, Admin, PrayerTimeEntry, ApiKey
    constants.ts             ← MAX_PAGE_SIZE, BCRYPT_COST, JWT_EXPIRY
    mosque.ts                ← Mosque.list(), .getByIdOrSlug(), .nearby(), .create(), .update(), .remove()
    auth.ts                  ← Auth.register(), .login(), .verifyToken()
    prayer-times.ts          ← PrayerTimes.getForMosque(), .getToday(), .upsert(), .bulkUpsert()
    api-key.ts               ← ApiKey.request(), .getByPrefix(), .validate()
    repository/
      mock.ts                ← In-memory Maps + seed data (swap for Drizzle later)
packages/functions/          ← All HTTP concerns (Hono app, routes, middleware, schemas)
  src/
    types.ts                 ← Hono AppEnv type
    api.ts                   ← Hono app wiring + Lambda handler export
    middleware/              ← admin-auth, api-key, ownership, rate-limit, cache
    schemas/                 ← Zod schemas for request/response validation
    routes/                  ← Hono route handlers (health, auth, mosques, prayer-times, api-keys)
```

## Architecture Rule

> `core` has **ZERO** knowledge of Hono, HTTP, request/response, or middleware.
> It exports plain functions that accept and return plain TypeScript objects.
> `functions` owns the Hono app, all routing, all middleware, all request parsing, all response formatting.

## Per-Module Imports

Core uses per-module exports (no barrel `index.ts`):
```ts
import * as Mosque from "@openislam/core/mosque";
import { verifyToken } from "@openislam/core/auth";
import * as PrayerTimes from "@openislam/core/prayer-times";
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

Drizzle migrations run from `packages/core/`:

```bash
cd packages/core
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

The adhan prayer calculation library will be built custom — do NOT install `adhan` from npm. The custom implementation will live in `packages/core/src/lib/`.

## Security Priorities

- No end-user personal data stored
- Search coordinates processed in-memory only — never persisted
- API keys are vetted (manual review before approval)
- All list endpoints: max 20 results, cursor-based pagination
- Admin routes enforce mosque_id ownership
- Passwords hashed with bcrypt (cost factor 12)
