# Qivam Platform

Open infrastructure for Muslim developers — SST v2 monorepo on AWS.

## Tech Stack

- **Infrastructure**: SST v2 (CDK-based), AWS `eu-west-1`
- **API**: Hono, single Lambda function behind API Gateway
- **Database**: Neon PostgreSQL (serverless) with PostGIS, Drizzle ORM
- **Driver**: `@neondatabase/serverless` (HTTP)
- **Validation**: Zod + `@hono/zod-openapi`
- **Auth**: JWT (jose), API keys
- **Email**: AWS SES (`@aws-sdk/client-sesv2`) — API key delivery
- **Storage**: S3 for mosque media
- **Package manager**: pnpm workspaces

## Project Structure

```
sst.config.ts
stacks/
  MainStack.ts
packages/core/                 ← Pure domain layer (NO Hono, NO HTTP)
  adapters/
    neon.adapter.ts            ← Neon/Drizzle database connection
    ses.adapter.ts             ← AWS SES email sending
    logger.adapter.ts          ← Structured JSON logger
  lib/
    prayer-calculation/        ← Custom prayer calculation (no npm adhan)
  models/
    mosque.model.ts            ← Mosque, MosqueFacility types
    admin.model.ts             ← Admin, AdminPublic types
    api-key.model.ts           ← ApiKey, ApiKeyPublic types
    prayer-times.model.ts      ← PrayerTimeEntry, PrayerName types
    invitation.model.ts        ← Invitation, InvitationPublic types
    shared.model.ts            ← PaginatedResult type
    index.ts                   ← Barrel re-export of all models
  repositories/
    mosque.repository.ts       ← Mosque DB queries
    admin.repository.ts        ← Admin DB queries
    prayer-times.repository.ts ← Prayer times DB queries
    api-key.repository.ts      ← API key DB queries
    invitation.repository.ts   ← Invitation DB queries
    index.ts                   ← Barrel re-export
  schemas/
    drizzle.schema.ts          ← Drizzle table definitions
    mosque.schema.ts           ← Zod schemas for mosque routes
    api-key.schema.ts          ← Zod schemas for API key routes
    auth.schema.ts             ← Zod schemas for auth routes
    common.schema.ts           ← Shared Zod schemas (pagination, errors)
    prayer-times.schema.ts     ← Zod schemas for prayer time routes
    prayer-calculation.schema.ts ← Zod schemas for calculation routes
  shared/
    helpers.ts                 ← slugify, sha256, haversineKm, generateId, etc.
  use-cases/
    mosques.use-case.ts        ← list, getByIdOrSlug, nearby, create, update, remove
    api-keys.use-case.ts       ← request, validate, getByPrefix, setAnalyticsEnabled
    auth.use-case.ts           ← register, login, verifyToken, createInvitation
    prayer-times.use-case.ts   ← getForMosque, getToday, upsert, bulkUpsert
  constants.ts
  errors.ts
  drizzle.config.ts
packages/functions/            ← All HTTP concerns (Hono app, routes, middleware)
  api.ts                       ← Hono app wiring + Lambda handler
  types.ts                     ← Hono AppEnv type
  middleware/                  ← Auth, rate limiting, cache, analytics, ownership
  routes/                      ← Hono route handlers
```

## Architecture Rule

`core` has zero knowledge of Hono, HTTP, request/response, or middleware. It exports plain functions that accept and return plain TypeScript objects. `functions` owns the Hono app, all routing, all middleware, all request parsing, all response formatting.

## Layer Naming Conventions

| Layer | Suffix | Example |
|---|---|---|
| Infrastructure adapters | `.adapter.ts` | `neon.adapter.ts` |
| Domain models (types only) | `.model.ts` | `mosque.model.ts` |
| DB queries | `.repository.ts` | `mosque.repository.ts` |
| Zod validation schemas | `.schema.ts` | `mosque.schema.ts` |
| Business logic | `.use-case.ts` | `mosques.use-case.ts` |

## Per-Module Imports

```ts
import * as Mosque from "@qivam/core/mosque";
import * as PrayerTimes from "@qivam/core/prayer-times";
import * as ApiKey from "@qivam/core/api-key";

// Schemas (in routes)
import { mosqueResponse } from "@qivam/core/schemas/mosque";
import { errorResponse } from "@qivam/core/schemas/common";

// Adapters (in routes/middleware)
import { log } from "@qivam/core/adapters/logger";
import { sendApiKeyEmail } from "@qivam/core/adapters/ses";
```

## Commands

From `platform/`:

```bash
pnpm install
pnpm typecheck
```

From `packages/core/`:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Coding Conventions

- ESM only (`"type": "module"` everywhere)
- Strict TypeScript — no `any`, no `@ts-ignore`
- Named exports only (no default exports except config files)
- Zod for all input validation
- Drizzle ORM for all DB queries — no raw SQL unless necessary

## Prayer Calculation

Custom implementation only — do NOT install `adhan` from npm. Lives in `packages/core/lib/prayer-calculation/`.

## Security

- No end-user personal data stored
- Search coordinates processed in-memory, never persisted
- API keys vetted before approval
- List endpoints: max 20 results, cursor-based pagination
- Passwords hashed with bcrypt (cost factor 12)
